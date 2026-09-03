from django.test import TestCase, override_settings
from django.core.management import call_command
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from rest_framework import status
from rest_framework.test import APIClient

from rentals.models import Order, TrackingEvent, DeliveryPartner
from rentals.status_engine import OrderStatusEngine
from users.models import Notification, Profile


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class SeedOrdersCommandTests(TestCase):
    def test_seed_orders_is_idempotent(self):
        call_command('seed_orders')
        first_count = Order.objects.count()
        first_notifications = Notification.objects.count()
        first_txns = list(Order.objects.exclude(transaction_id__isnull=True).values_list('transaction_id', flat=True))

        call_command('seed_orders')
        self.assertEqual(Order.objects.count(), first_count)
        self.assertGreater(first_notifications, 0)
        self.assertEqual(Notification.objects.count(), first_notifications)
        self.assertEqual(len(first_txns), len(set(first_txns)))

        paid_orders = Order.objects.filter(payment_status__in=['paid', 'cod_pending'])
        for order in paid_orders:
            self.assertTrue(order.transaction_id)
            self.assertTrue(order.transaction_id.startswith('TXN-'))


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class OrderStatusEngineTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='engineuser',
            email='engine@peakkit.com',
            password='Test@1234',
            first_name='Engine',
        )
        Profile.objects.get_or_create(user=self.user)
        self.partner = DeliveryPartner.objects.create(
            name='Hari Sharma',
            phone_number='9841111111',
            whatsapp_number='9841111111',
            email='hari-test@peakkit.delivery',
            vehicle_type='bike',
            vehicle_number='TEST-001',
            available=True,
        )
        self.order = Order.objects.create(
            customer=self.user,
            customer_phone='9841234567',
            customer_email=self.user.email,
            destination='Everest Base Camp',
            address='Thamel',
            landmark='Garden',
            payment_method='card',
            payment_status='paid',
            order_status='pending',
            subtotal=Decimal('5000.00'),
            delivery_charge=Decimal('500.00'),
            security_deposit=Decimal('1000.00'),
            transaction_id=Order.generate_transaction_id(),
            return_date=timezone.now() + timedelta(days=7),
        )

    @patch('rentals.status_engine.whatsapp_service.send_text_message', return_value={'ok': True})
    @patch('rentals.status_engine.whatsapp_service.send_order_confirmation', return_value={'ok': True})
    @patch('rentals.status_engine.whatsapp_service.send_payment_confirmation', return_value={'ok': True})
    @patch('rentals.status_engine.whatsapp_service.send_rider_assigned', return_value={'ok': True})
    @patch('rentals.status_engine.whatsapp_service.send_delivery_confirmation', return_value={'ok': True})
    @patch('rentals.status_engine.whatsapp_service.send_rider_notification', return_value={'ok': True})
    def test_create_and_status_updates_create_notifications_and_tracking(self, *mocks):
        OrderStatusEngine.on_order_created(self.order, send_external=False)
        self.assertTrue(
            Notification.objects.filter(
                user=self.user,
                title='Reservation Confirmed',
                related_order_id=self.order.order_id,
            ).exists()
        )
        self.assertTrue(
            TrackingEvent.objects.filter(order=self.order, title='Reservation Confirmed').exists()
        )

        OrderStatusEngine.update_order_status(self.order, 'confirmed', send_external=False)
        self.order.refresh_from_db()
        self.assertEqual(self.order.order_status, 'confirmed')
        self.assertIsNotNone(self.order.delivery_partner)
        self.partner.refresh_from_db()
        self.assertFalse(self.partner.available)

        OrderStatusEngine.update_order_status(self.order, 'packed', send_external=False)
        self.assertTrue(Notification.objects.filter(related_order_id=self.order.order_id, title='Gear Packed').exists())
        self.assertTrue(TrackingEvent.objects.filter(order=self.order, title='Gear Sanitized').exists())
        self.assertTrue(TrackingEvent.objects.filter(order=self.order, title='Packed At PeakKit Warehouse').exists())

        event_count = TrackingEvent.objects.filter(order=self.order).count()
        OrderStatusEngine.update_order_status(self.order, 'packed', send_external=False)
        self.assertEqual(TrackingEvent.objects.filter(order=self.order).count(), event_count)

        OrderStatusEngine.update_order_status(self.order, 'shipped', send_external=False)
        self.assertTrue(Notification.objects.filter(related_order_id=self.order.order_id, title='Order Shipped').exists())
        self.assertTrue(TrackingEvent.objects.filter(order=self.order, title='Rider Assigned').exists())

        OrderStatusEngine.update_order_status(self.order, 'out_for_delivery', send_external=False)
        self.assertTrue(Notification.objects.filter(title='Out for Delivery', related_order_id=self.order.order_id).exists())

        OrderStatusEngine.update_order_status(self.order, 'delivered', send_external=False)
        self.assertTrue(Notification.objects.filter(title='Order Delivered', related_order_id=self.order.order_id).exists())
        self.assertTrue(TrackingEvent.objects.filter(order=self.order, title='Delivered').exists())
        self.assertTrue(TrackingEvent.objects.filter(order=self.order, title='Return Reminder').exists())
        self.partner.refresh_from_db()
        self.assertTrue(self.partner.available)


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class OrderAndNotificationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='apiuser',
            email='api@peakkit.com',
            password='Test@1234',
            first_name='Api',
        )
        Profile.objects.get_or_create(user=self.user)
        DeliveryPartner.objects.create(
            name='Priya Tamang',
            phone_number='9842222222',
            whatsapp_number='9842222222',
            email='priya-test@peakkit.delivery',
            vehicle_type='scooter',
            vehicle_number='TEST-002',
            available=True,
        )
        self.client.force_authenticate(user=self.user)

    @patch('rentals.status_engine.whatsapp_service.send_text_message', return_value=None)
    @patch('rentals.status_engine.whatsapp_service.send_order_confirmation', return_value=None)
    @patch('rentals.status_engine.whatsapp_service.send_payment_confirmation', return_value=None)
    @patch('rentals.status_engine.whatsapp_service.send_rider_assigned', return_value=None)
    @patch('rentals.status_engine.whatsapp_service.send_delivery_confirmation', return_value=None)
    @patch('rentals.status_engine.whatsapp_service.send_rider_notification', return_value=None)
    def test_order_and_notification_endpoints(self, *mocks):
        create_response = self.client.post('/api/orders/create/', {
            'customer_phone': '9841234567',
            'customer_email': self.user.email,
            'destination': 'Mardi Himal',
            'address': 'Thamel, Kathmandu',
            'landmark': 'Near Garden of Dreams',
            'payment_method': 'cod',
            'subtotal': '7500.00',
            'delivery_charge': '500.00',
            'security_deposit': '1000.00',
        }, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        order_id = create_response.json()['order']['order_id']

        list_response = self.client.get('/api/orders/')
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.json()['count'], 1)

        detail_response = self.client.get(f'/api/orders/{order_id}/')
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertTrue(detail_response.json()['order']['tracking_events'])

        status_response = self.client.patch(f'/api/orders/{order_id}/status/', {
            'order_status': 'packed',
            'payment_status': 'paid',
        }, format='json')
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        self.assertEqual(status_response.json()['order']['order_status'], 'packed')
        self.assertIsNotNone(status_response.json()['order']['delivery_partner'])

        notifications = self.client.get('/api/notifications/')
        self.assertEqual(notifications.status_code, status.HTTP_200_OK)
        self.assertGreater(notifications.json()['unread_count'], 0)
        self.assertGreater(len(notifications.json()['notifications']), 0)
        first_id = notifications.json()['notifications'][0]['id']

        read_one = self.client.patch(f'/api/notifications/{first_id}/read/')
        self.assertEqual(read_one.status_code, status.HTTP_200_OK)
        self.assertTrue(read_one.json()['notification']['is_read'])

        read_all = self.client.patch('/api/notifications/read-all/')
        self.assertEqual(read_all.status_code, status.HTTP_200_OK)
        self.assertEqual(read_all.json()['unread_count'], 0)

        after = self.client.get('/api/notifications/')
        self.assertEqual(after.json()['unread_count'], 0)
