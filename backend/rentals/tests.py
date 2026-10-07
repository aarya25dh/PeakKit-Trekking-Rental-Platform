from django.test import TestCase, override_settings
from django.core.management import call_command
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from rest_framework import status
from rest_framework.test import APIClient

from rentals.models import Order, TrackingEvent, DeliveryPartner, Gear
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

    @patch('rentals.status_engine.whatsapp_service.send_text_message', return_value={'ok': True})
    @patch('rentals.status_engine.whatsapp_service.send_order_confirmation', return_value={'ok': True})
    @patch('rentals.status_engine.whatsapp_service.send_payment_confirmation', return_value={'ok': True})
    @patch('rentals.status_engine.whatsapp_service.send_rider_assigned', return_value={'ok': True})
    @patch('rentals.status_engine.whatsapp_service.send_delivery_confirmation', return_value={'ok': True})
    @patch('rentals.status_engine.whatsapp_service.send_rider_notification', return_value={'ok': True})
    @patch('rentals.status_engine.whatsapp_service.send_return_reminder', return_value={'ok': True})
    def test_no_future_events_created_at_intermediate_status(self, *mocks):
        """
        Hotfix: PATCH status to 'shipped' must NOT create Out For Delivery,
        Delivered, or Return Reminder events.  Only events up to 'shipped' are allowed.
        """
        # Advance order to 'shipped' step by step
        OrderStatusEngine.on_order_created(self.order, send_external=False)
        OrderStatusEngine.update_order_status(self.order, 'confirmed', send_external=False)
        OrderStatusEngine.update_order_status(self.order, 'packed', send_external=False)
        OrderStatusEngine.update_order_status(self.order, 'shipped', send_external=False)

        events = list(TrackingEvent.objects.filter(order=self.order).values_list('title', flat=True))

        # Events that MUST exist at 'shipped'
        expected = [
            'Reservation Confirmed',
            'Payment Verified',
            'Gear Sanitized',
            'Packed At PeakKit Warehouse',
            'Rider Assigned',
        ]
        for title in expected:
            self.assertIn(title, events, f"Expected '{title}' to exist at 'shipped'")

        # Events that must NOT exist yet at 'shipped'
        forbidden = ['Out For Delivery', 'Delivered', 'Return Reminder']
        for title in forbidden:
            self.assertNotIn(title, events, f"'{title}' must not exist at 'shipped' (future event)")

    @patch('rentals.status_engine.whatsapp_service.send_text_message', return_value={'ok': True})
    @patch('rentals.status_engine.whatsapp_service.send_order_confirmation', return_value={'ok': True})
    @patch('rentals.status_engine.whatsapp_service.send_payment_confirmation', return_value={'ok': True})
    @patch('rentals.status_engine.whatsapp_service.send_rider_assigned', return_value={'ok': True})
    @patch('rentals.status_engine.whatsapp_service.send_delivery_confirmation', return_value={'ok': True})
    @patch('rentals.status_engine.whatsapp_service.send_rider_notification', return_value={'ok': True})
    @patch('rentals.status_engine.whatsapp_service.send_return_reminder', return_value={'ok': True})
    def test_timeline_sequential_progression(self, *mocks):
        """
        Full sequential check: at each status transition, exactly the right set of
        tracking events exists — no more, no less.
        """
        def events():
            return set(TrackingEvent.objects.filter(order=self.order).values_list('title', flat=True))

        # --- pending (on_order_created) ---
        OrderStatusEngine.on_order_created(self.order, send_external=False)
        self.assertIn('Reservation Confirmed', events())
        self.assertNotIn('Payment Verified', events())
        self.assertNotIn('Gear Sanitized', events())
        self.assertNotIn('Rider Assigned', events())
        self.assertNotIn('Out For Delivery', events())
        self.assertNotIn('Delivered', events())
        self.assertNotIn('Return Reminder', events())

        # --- confirmed ---
        OrderStatusEngine.update_order_status(self.order, 'confirmed', send_external=False)
        # payment_status='paid' so Payment Verified should now appear
        self.assertIn('Payment Verified', events())
        self.assertNotIn('Gear Sanitized', events())
        self.assertNotIn('Rider Assigned', events())
        self.assertNotIn('Out For Delivery', events())
        self.assertNotIn('Delivered', events())
        self.assertNotIn('Return Reminder', events())

        # --- packed ---
        OrderStatusEngine.update_order_status(self.order, 'packed', send_external=False)
        self.assertIn('Gear Sanitized', events())
        self.assertIn('Packed At PeakKit Warehouse', events())
        self.assertNotIn('Rider Assigned', events())
        self.assertNotIn('Out For Delivery', events())
        self.assertNotIn('Delivered', events())
        self.assertNotIn('Return Reminder', events())

        # --- shipped ---
        OrderStatusEngine.update_order_status(self.order, 'shipped', send_external=False)
        self.assertIn('Rider Assigned', events())
        self.assertNotIn('Out For Delivery', events())
        self.assertNotIn('Delivered', events())
        self.assertNotIn('Return Reminder', events())

        # --- out_for_delivery ---
        OrderStatusEngine.update_order_status(self.order, 'out_for_delivery', send_external=False)
        self.assertIn('Out For Delivery', events())
        self.assertNotIn('Delivered', events())
        self.assertNotIn('Return Reminder', events())

        # --- delivered ---
        OrderStatusEngine.update_order_status(self.order, 'delivered', send_external=False)
        self.assertIn('Delivered', events())
        # return_date is set on self.order so Return Reminder should appear
        self.assertIn('Return Reminder', events())

        # Idempotency: calling sync again must not create duplicates
        pre_count = TrackingEvent.objects.filter(order=self.order).count()
        OrderStatusEngine.sync_tracking_events(self.order)
        self.assertEqual(TrackingEvent.objects.filter(order=self.order).count(), pre_count)

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

    @patch('rentals.status_engine.whatsapp_service.send_text_message', return_value=None)
    @patch('rentals.status_engine.whatsapp_service.send_order_confirmation', return_value=None)
    @patch('rentals.status_engine.whatsapp_service.send_payment_confirmation', return_value=None)
    def test_create_order_minimal_payload_with_esewa_and_khalti(self, *mocks):
        # Minimal payload as specified in Bug 1 with esewa
        esewa_res = self.client.post('/api/orders/create/', {
            'destination': 'Mardi Himal',
            'address': 'Kathmandu',
            'landmark': 'Boudha Stupa',
            'phone_number': '9800000000',
            'payment_method': 'esewa',
        }, format='json')
        self.assertEqual(esewa_res.status_code, status.HTTP_201_CREATED)
        esewa_data = esewa_res.json()['order']
        self.assertEqual(esewa_data['payment_method'], 'esewa')
        self.assertEqual(esewa_data['customer_email'], self.user.email)
        self.assertEqual(esewa_data['customer_phone'], '9800000000')
        self.assertEqual(esewa_data['order_status'], 'confirmed')
        self.assertTrue(esewa_data['transaction_id'])
        self.assertTrue(any(ev['title'] == 'Reservation Confirmed' for ev in esewa_data['tracking_events']))

        # Test Khalti normalization
        khalti_res = self.client.post('/api/orders/create/', {
            'destination': 'Langtang Valley',
            'address': 'Pokhara',
            'landmark': 'Lakeside',
            'phone_number': '9811111111',
            'payment_method': 'KHALTI',
        }, format='json')
        self.assertEqual(khalti_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(khalti_res.json()['order']['payment_method'], 'khalti')

        # Test Cash on Delivery alias normalization
        cod_res = self.client.post('/api/orders/create/', {
            'destination': 'Annapurna Base Camp',
            'address': 'Thamel',
            'landmark': 'Chhetrapati',
            'phone_number': '9822222222',
            'payment_method': 'cash_on_delivery',
        }, format='json')
        self.assertEqual(cod_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(cod_res.json()['order']['payment_method'], 'cod')

        # Verify string order_id detail endpoint
        order_id = esewa_data['order_id']
        detail_res = self.client.get(f'/api/orders/{order_id}/')
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_res.json()['order']['order_id'], order_id)

        # Verify notification created
        notif_res = self.client.get('/api/notifications/')
        self.assertEqual(notif_res.status_code, status.HTTP_200_OK)
        self.assertTrue(any(n['related_order_id'] == order_id for n in notif_res.json()['notifications']))

    @patch('rentals.services.whatsapp_service.send_text_message')
    def test_order_status_update_flow_and_whatsapp_service(self, mock_send_text):
        mock_send_text.return_value = {'success': True, 'data': {'messages': [{'id': 'wamid.123'}]}}

        order = Order.objects.create(
            customer=self.user,
            customer_email=self.user.email,
            customer_phone='9860467948',
            destination='Mardi Himal',
            address='Kathmandu',
            payment_method='card',
            payment_status='pending',
            order_status='pending',
            subtotal=Decimal('5000.00'),
            delivery_charge=Decimal('500.00'),
            security_deposit=Decimal('1000.00'),
        )

        # 1. Update to shipped
        shipped_res = self.client.patch(f'/api/orders/{order.order_id}/status/', {
            'order_status': 'shipped'
        }, format='json')
        self.assertEqual(shipped_res.status_code, status.HTTP_200_OK)
        self.assertEqual(shipped_res.json()['order']['order_status'], 'shipped')
        order.refresh_from_db()
        self.assertEqual(order.order_status, 'shipped')

        # 2. Update to out_for_delivery
        out_res = self.client.patch(f'/api/orders/{order.order_id}/status/', {
            'order_status': 'out_for_delivery'
        }, format='json')
        self.assertEqual(out_res.status_code, status.HTTP_200_OK)
        self.assertEqual(out_res.json()['order']['order_status'], 'out_for_delivery')
        order.refresh_from_db()
        self.assertEqual(order.order_status, 'out_for_delivery')

        # 3. Update to delivered
        deliv_res = self.client.patch(f'/api/orders/{order.order_id}/status/', {
            'order_status': 'delivered'
        }, format='json')
        self.assertEqual(deliv_res.status_code, status.HTTP_200_OK)
        self.assertEqual(deliv_res.json()['order']['order_status'], 'delivered')
        order.refresh_from_db()
        self.assertEqual(order.order_status, 'delivered')

        # 4. Invalid status returns 400
        invalid_res = self.client.patch(f'/api/orders/{order.order_id}/status/', {
            'order_status': 'invalid_status_xyz'
        }, format='json')
        self.assertEqual(invalid_res.status_code, status.HTTP_400_BAD_REQUEST)
        order.refresh_from_db()
        self.assertEqual(order.order_status, 'delivered')

        # 5. Nonexistent order returns 404
        nonexistent_res = self.client.patch('/api/orders/PK-9999-999999/status/', {
            'order_status': 'shipped'
        }, format='json')
        self.assertEqual(nonexistent_res.status_code, status.HTTP_404_NOT_FOUND)

        # 6. Nonexistent notification returns 404
        nonexistent_notif_res = self.client.patch('/api/notifications/999999/read/')
        self.assertEqual(nonexistent_notif_res.status_code, status.HTTP_404_NOT_FOUND)


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class RentalDurationAndAvailabilityEngineTests(TestCase):
    """
    Comprehensive tests for PeakKit Sprint 3.4A:
    - Rental day calculation & validation
    - Price engine (subtotal = daily * days)
    - Overlap rejection and next available date
    - Gear availability endpoint
    - Cart recalculation endpoint
    - Return engine workflow
    """
    def setUp(self):
        from rentals.models import Gear, RentalReservation
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='rentaluser',
            email='rental@peakkit.com',
            password='Test@1234',
            first_name='Rental',
            last_name='Tester',
        )
        self.client.force_authenticate(user=self.user)

        self.gear = Gear.objects.create(
            gear_id='gear-test-pack-01',
            name='Alpine Expedition 65L Pack',
            category='Backpacks',
            daily_rental_price=Decimal('600.00'),
        )

        # Existing reservation: 2026-10-10 to 2026-10-17
        self.reservation = RentalReservation.objects.create(
            gear=self.gear,
            rental_start_date='2026-10-10',
            rental_end_date='2026-10-17',
            reservation_status='Active'
        )

    def test_rental_days_and_price_calculation(self):
        """Test valid dates dynamically calculate rental_days and subtotal."""
        res = self.client.post('/api/orders/create/', {
            'destination': 'Annapurna Base Camp',
            'address': 'Pokhara',
            'phone_number': '9841234567',
            'rental_start_date': '2026-11-01',
            'rental_end_date': '2026-11-11',
            'daily_rental_price': '800.00',
            'delivery_charge': '500.00',
            'security_deposit': '1000.00',
            'payment_method': 'card',
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        order_data = res.json()['order']
        self.assertEqual(order_data['rental_days'], 10)
        self.assertEqual(Decimal(str(order_data['subtotal'])), Decimal('8000.00'))
        self.assertEqual(Decimal(str(order_data['total_amount'])), Decimal('9500.00'))
        self.assertEqual(order_data['reservation_status'], 'Active')

    def test_invalid_dates_rejected(self):
        """End date before start date, <1 day, and >30 days must be rejected."""
        # 1. End date before start date
        res1 = self.client.post('/api/orders/create/', {
            'destination': 'Langtang',
            'address': 'Kathmandu',
            'rental_start_date': '2026-11-10',
            'rental_end_date': '2026-11-05',
        }, format='json')
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Same day (<1 day)
        res2 = self.client.post('/api/orders/create/', {
            'destination': 'Langtang',
            'address': 'Kathmandu',
            'rental_start_date': '2026-11-10',
            'rental_end_date': '2026-11-10',
        }, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Exceeding 30 days
        res3 = self.client.post('/api/orders/create/', {
            'destination': 'Langtang',
            'address': 'Kathmandu',
            'rental_start_date': '2026-11-01',
            'rental_end_date': '2026-12-05',
        }, format='json')
        self.assertEqual(res3.status_code, status.HTTP_400_BAD_REQUEST)

    def test_overlapping_reservation_rejected_with_next_available_date(self):
        """Overlapping reservations must return 400 with next_available_date."""
        res = self.client.post('/api/orders/create/', {
            'destination': 'Everest Region',
            'address': 'Kathmandu',
            'gear_id': self.gear.gear_id,
            'rental_start_date': '2026-10-12',
            'rental_end_date': '2026-10-20',
            'payment_method': 'card',
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        error_data = res.json()
        error_msg = str(error_data)
        self.assertIn("Gear unavailable for selected dates.", error_msg)
        self.assertIn("2026-10-18", error_msg)

    def test_gear_availability_endpoint(self):
        """GET /api/gear/<gear_id>/availability/ returns booked ranges and next available date."""
        res = self.client.get(f'/api/gear/{self.gear.gear_id}/availability/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['gear_id'], self.gear.gear_id)
        self.assertTrue(len(data['booked_ranges']) >= 1)
        self.assertEqual(data['booked_ranges'][0]['start'], '2026-10-10')
        self.assertEqual(data['booked_ranges'][0]['end'], '2026-10-17')
        self.assertTrue(data['next_available_date'])

    def test_cart_item_recalculation_endpoint(self):
        """PATCH /api/cart/<item_id>/ returns updated duration, subtotal, and total amount."""
        res = self.client.patch('/api/cart/item-test-123/', {
            'rental_start_date': '2026-10-01',
            'rental_end_date': '2026-10-06',
            'daily_rental_price': '700.00',
            'quantity': 2,
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['rental_days'], 5)
        # 700 * 5 * 2 = 7000
        self.assertEqual(Decimal(data['subtotal']), Decimal('7000.00'))
        # 60% deposit = 4200, total = 7000 + 4200 = 11200
        self.assertEqual(Decimal(data['security_deposit']), Decimal('4200.00'))
        self.assertEqual(Decimal(data['total_amount']), Decimal('11200.00'))

    def test_order_return_workflow(self):
        """PATCH /api/orders/<order_id>/return/ sets status to Returned, creates events & notification."""
        order = Order.objects.create(
            customer=self.user,
            customer_email=self.user.email,
            customer_phone='9841234567',
            destination='Mardi Himal',
            address='Kathmandu',
            payment_method='card',
            payment_status='paid',
            order_status='delivered',
            reservation_status='Active',
            rental_start_date='2026-09-01',
            rental_end_date='2026-09-08',
            rental_days=7,
            subtotal=Decimal('5600.00'),
        )

        res = self.client.patch(f'/api/orders/{order.order_id}/return/', {
            'condition': 'good'
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.reservation_status, 'Returned')
        self.assertTrue(order.return_completed)
        self.assertIsNotNone(order.return_completed_at)

        # Check tracking event
        self.assertTrue(
            order.tracking_events.filter(title='Return Completed').exists()
        )
        # Check notification
        self.assertTrue(
            Notification.objects.filter(
                user=self.user,
                title='Deposit Refund Processing',
                related_order_id=order.order_id
            ).exists()
        )


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class InventoryAndAdminManagementTests(TestCase):
    """Sprint 3.4B: Inventory, return/damage workflow, admin analytics, and CSV exports."""

    def setUp(self):
        from rentals.models import Gear, GearReturn, RentalReservation
        self.client = APIClient()
        self.staff_user = User.objects.create_user(
            username='staffuser',
            email='staff@peakkit.com',
            password='Test@1234',
            first_name='Staff',
            is_staff=True,
        )
        self.normal_user = User.objects.create_user(
            username='normaluser',
            email='normal@peakkit.com',
            password='Test@1234',
            first_name='Normal',
            is_staff=False,
        )
        Profile.objects.get_or_create(user=self.staff_user)
        Profile.objects.get_or_create(user=self.normal_user)

        self.gear = Gear.objects.create(
            gear_id='gear-tent-4p',
            name='Himalayan 4-Season Tent',
            category='Tents',
            brand='PeakKit',
            daily_rental_price=Decimal('1000.00'),
            purchase_price=Decimal('25000.00'),
            quantity_total=5,
            quantity_available=5,
            quantity_reserved=0,
            quantity_under_maintenance=0,
        )

    def test_gear_sku_generation_and_properties(self):
        """SKU is generated automatically if blank, and rental_price_per_day alias works."""
        self.assertTrue(self.gear.sku.startswith('GEAR-'))
        self.assertEqual(self.gear.rental_price_per_day, Decimal('1000.00'))
        self.gear.rental_price_per_day = Decimal('1200.00')
        self.assertEqual(self.gear.daily_rental_price, Decimal('1200.00'))

    def test_inventory_deduction_on_order_reservation(self):
        """Creating an order with gear decrements quantity_available and increments quantity_reserved."""
        self.client.force_authenticate(user=self.normal_user)
        initial_avail = self.gear.quantity_available
        initial_res = self.gear.quantity_reserved

        res = self.client.post('/api/orders/create/', {
            'destination': 'Gosaikunda Trek',
            'address': 'Dhunche',
            'gear_id': self.gear.gear_id,
            'rental_start_date': '2026-11-10',
            'rental_end_date': '2026-11-15',
            'daily_rental_price': '1000.00',
            'security_deposit': '3000.00',
            'payment_method': 'card',
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.gear.refresh_from_db()
        self.assertEqual(self.gear.quantity_available, initial_avail - 1)
        self.assertEqual(self.gear.quantity_reserved, initial_res + 1)

    def test_inventory_restoration_on_return(self):
        """Returning an order restores inventory idempotently."""
        self.client.force_authenticate(user=self.normal_user)
        # Create order
        res = self.client.post('/api/orders/create/', {
            'destination': 'Helambu',
            'address': 'Sundarijal',
            'gear_id': self.gear.gear_id,
            'rental_start_date': '2026-11-01',
            'rental_end_date': '2026-11-05',
            'daily_rental_price': '1000.00',
            'security_deposit': '2000.00',
            'payment_method': 'card',
        }, format='json')
        order_id = res.json()['order']['order_id']
        self.gear.refresh_from_db()
        self.assertEqual(self.gear.quantity_reserved, 1)

        # Return order
        return_res = self.client.patch(f'/api/orders/{order_id}/return/', {
            'condition': 'good'
        }, format='json')
        self.assertEqual(return_res.status_code, status.HTTP_200_OK)

        self.gear.refresh_from_db()
        self.assertEqual(self.gear.quantity_reserved, 0)
        self.assertEqual(self.gear.quantity_available, 5)

        # Repeating return should not restore inventory again (idempotent)
        repeat_res = self.client.patch(f'/api/orders/{order_id}/return/', {
            'condition': 'good'
        }, format='json')
        self.assertEqual(repeat_res.status_code, status.HTTP_200_OK)
        self.gear.refresh_from_db()
        self.assertEqual(self.gear.quantity_available, 5)
        self.assertEqual(self.gear.quantity_reserved, 0)

    def test_gear_return_damage_fee_and_refund_calculation(self):
        """GearReturn calculates refund = deposit - fee, minimum 0."""
        from rentals.models import GearReturn
        order = Order.objects.create(
            customer=self.normal_user,
            customer_email=self.normal_user.email,
            destination='Manaslu',
            address='Gorkha',
            security_deposit=Decimal('2000.00'),
            total_amount=Decimal('5000.00'),
            rental_start_date='2026-10-01',
            rental_end_date='2026-10-06',
            rental_days=5,
        )

        # Case 1: Partial damage
        ret1 = GearReturn.objects.create(
            order=order,
            gear=self.gear,
            deposit_held=Decimal('2000.00'),
            damage_fee=Decimal('500.00'),
        )
        self.assertEqual(ret1.refund_amount, Decimal('1500.00'))

        # Case 2: Damage fee exceeds deposit -> refund must be 0, never negative
        ret1.damage_fee = Decimal('3000.00')
        ret1.save()
        self.assertEqual(ret1.refund_amount, Decimal('0.00'))

    def test_inspection_endpoint_staff_only_and_damage_fee(self):
        """POST /api/orders/<order_id>/inspect/ is staff-only, updates GearReturn and inventory."""
        order = Order.objects.create(
            customer=self.normal_user,
            customer_email=self.normal_user.email,
            destination='Langtang',
            address='Syabrubesi',
            security_deposit=Decimal('3000.00'),
            total_amount=Decimal('8000.00'),
            rental_start_date='2026-10-10',
            rental_end_date='2026-10-15',
            rental_days=5,
        )
        from rentals.models import RentalReservation
        RentalReservation.objects.create(
            gear=self.gear,
            order=order,
            rental_start_date='2026-10-10',
            rental_end_date='2026-10-15',
            reservation_status='Active'
        )
        self.gear.quantity_available = 4
        self.gear.quantity_reserved = 1
        self.gear.save()

        # 1. Unauthenticated -> 401
        self.client.force_authenticate(user=None)
        res_unauth = self.client.post(f'/api/orders/{order.order_id}/inspect/', {})
        self.assertEqual(res_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Non-staff authenticated -> 403
        self.client.force_authenticate(user=self.normal_user)
        res_forbidden = self.client.post(f'/api/orders/{order.order_id}/inspect/', {
            'condition': 'minor_damage',
            'damage_fee': '500.00',
        }, format='json')
        self.assertEqual(res_forbidden.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Staff -> 200
        self.client.force_authenticate(user=self.staff_user)
        res_staff = self.client.post(f'/api/orders/{order.order_id}/inspect/', {
            'condition': 'minor_damage',
            'damage_notes': 'Torn zipper flap',
            'damage_fee': '600.00',
            'cleaning_required': True,
        }, format='json')
        self.assertEqual(res_staff.status_code, status.HTTP_200_OK)
        data = res_staff.json()
        self.assertEqual(data['damage_fee'], '600.00')
        self.assertEqual(data['refund_amount'], '2400.00')
        self.assertTrue(data['cleaning_required'])

        # Inventory restored
        self.gear.refresh_from_db()
        self.assertEqual(self.gear.quantity_reserved, 0)
        self.assertEqual(self.gear.quantity_available, 5)

    def test_rentals_availability_alias_endpoint(self):
        """GET /api/rentals/availability/<gear_id>/ returns availability data."""
        res = self.client.get(f'/api/rentals/availability/{self.gear.gear_id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['gear_id'], self.gear.gear_id)
        self.assertIn('booked_ranges', data)
        self.assertIn('next_available_date', data)

    def test_analytics_permissions_and_endpoints(self):
        """Analytics endpoints require staff; non-staff get 403, unauthenticated get 401."""
        endpoints = [
            '/api/admin/analytics/dashboard/',
            '/api/admin/analytics/revenue/monthly/',
            '/api/admin/analytics/rentals/active/',
            '/api/admin/analytics/inventory/utilization/',
            '/api/admin/analytics/gear/top-rented/',
            '/api/admin/analytics/returns/pending/',
        ]

        # 401 for unauthenticated
        self.client.force_authenticate(user=None)
        for ep in endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED, f"Failed for {ep}")

        # 403 for non-staff
        self.client.force_authenticate(user=self.normal_user)
        for ep in endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN, f"Failed for {ep}")

        # 200 for staff
        self.client.force_authenticate(user=self.staff_user)
        for ep in endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, status.HTTP_200_OK, f"Failed for {ep}")

        # Check dashboard content
        dash = self.client.get('/api/admin/analytics/dashboard/').json()
        self.assertIn('total_orders', dash)
        self.assertIn('total_revenue', dash)
        self.assertIn('active_rentals', dash)
        self.assertIn('pending_returns', dash)

        # Check inventory utilization content
        util = self.client.get('/api/admin/analytics/inventory/utilization/').json()
        self.assertIn('inventory_utilization', util)

    def test_csv_export_permissions_and_content(self):
        """CSV export endpoints require staff and return text/csv with attachment headers."""
        csv_endpoints = [
            ('/api/admin/export/orders/', 'orders_export.csv'),
            ('/api/admin/export/rentals/', 'rentals_export.csv'),
            ('/api/admin/export/customers/', 'customers_export.csv'),
            ('/api/admin/export/inventory/', 'inventory_export.csv'),
        ]

        # 401 unauth
        self.client.force_authenticate(user=None)
        for ep, _ in csv_endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # 403 non-staff
        self.client.force_authenticate(user=self.normal_user)
        for ep, _ in csv_endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # 200 staff and check CSV headers and content
        self.client.force_authenticate(user=self.staff_user)
        for ep, filename in csv_endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            self.assertTrue(res['Content-Type'].startswith('text/csv'))
            self.assertIn(f'filename="{filename}"', res['Content-Disposition'])
            content = res.content.decode('utf-8')
            self.assertGreater(len(content.splitlines()), 0)


class GlobalSearchTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.gear = Gear.objects.create(
            gear_id='gear-search-01',
            name='Everest Summit Tent',
            category='Camping',
            brand='Mountain Hardwear',
            daily_rental_price=Decimal('1500.00'),
            quantity_total=5,
            quantity_available=5,
        )

    def test_global_search_empty_query(self):
        res = self.client.get('/api/search/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['count'], 0)
        self.assertEqual(data['gear'], [])

    def test_global_search_matching_query(self):
        res = self.client.get('/api/search/?q=Everest')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertGreater(data['count'], 0)
        self.assertTrue(any(g['name'] == 'Everest Summit Tent' for g in data['gear']))
        self.assertTrue(any('Everest' in d['name'] for d in data['destinations']))

    def test_global_search_category_and_destination(self):
        res = self.client.get('/api/search/?q=backpack')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertTrue(any('Backpack' in c['name'] for c in data['categories']))


class AdventureKitAndCatalogTests(TestCase):
    def setUp(self):
        from rentals.models import Gear, AdventureKit, AdventureKitItem
        self.client = APIClient()
        self.gear1 = Gear.objects.create(
            gear_id='gear-cat-01',
            name='Osprey Aether 65',
            category='Backpacks',
            brand='Osprey',
            daily_rental_price=Decimal('600.00'),
            quantity_total=5,
            quantity_available=5,
        )
        self.gear2 = Gear.objects.create(
            gear_id='gear-cat-02',
            name='Rab Down Parka',
            category='Jackets',
            brand='Rab',
            daily_rental_price=Decimal('500.00'),
            quantity_total=4,
            quantity_available=4,
        )
        self.kit = AdventureKit.objects.create(
            kit_id='KIT-TEST-01',
            slug='test-expedition-kit',
            name='Test Expedition Kit',
            category='Trekking',
            destination='Everest Base Camp',
            difficulty='Moderate',
            base_discount_percent=20,
        )
        AdventureKitItem.objects.create(kit=self.kit, gear=self.gear1, quantity=1)
        AdventureKitItem.objects.create(kit=self.kit, gear=self.gear2, quantity=1)

    def test_public_gear_listing_and_filtering(self):
        res = self.client.get('/api/gear/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(res.json()['count'], 2)

        # Filter by category
        res_filtered = self.client.get('/api/gear/?category=Backpacks')
        self.assertEqual(res_filtered.status_code, status.HTTP_200_OK)
        self.assertTrue(all(g['category'] == 'Backpacks' for g in res_filtered.json()['gear']))

    def test_public_kit_listing_and_detail(self):
        res = self.client.get('/api/kits/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(res.json()['count'], 1)

        # Detail by slug
        res_detail = self.client.get(f'/api/kits/{self.kit.slug}/')
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        data = res_detail.json()['kit']
        self.assertEqual(data['name'], 'Test Expedition Kit')
        self.assertEqual(len(data['items']), 2)
        self.assertTrue(data['is_available'])


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class FastOrderConfirmationAndIdempotencyTests(TestCase):
    """
    Verifies that order creation returns immediately without blocking on external WhatsApp / email dispatches.
    """
    def setUp(self):
        import time
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='speedcustomer',
            email='speed@peakkit.com',
            password='Test@1234',
            first_name='Fast',
            last_name='User'
        )
        Profile.objects.get_or_create(user=self.user)
        self.client.force_authenticate(user=self.user)
        self.gear = Gear.objects.create(
            gear_id='speed-gear-01',
            name='Mountain Tent 3P',
            category='Tents',
            brand='Black Diamond',
            daily_rental_price=Decimal('800.00'),
            quantity_total=10,
            quantity_available=10,
        )

    def test_order_creation_is_fast_and_non_blocking(self):
        import time
        start_time = time.time()
        res = self.client.post('/api/orders/create/', {
            'destination': 'Langtang Valley',
            'address': 'Dhungedhara, Kathmandu',
            'landmark': 'Near Water Tank',
            'payment_method': 'card',
            'rental_start_date': str(timezone.now().date() + timedelta(days=2)),
            'rental_end_date': str(timezone.now().date() + timedelta(days=9)),
            'gear_id': self.gear.gear_id,
            'items': [{
                'id': self.gear.gear_id,
                'name': self.gear.name,
                'rentalPrice': 800,
                'quantity': 1,
            }],
            'subtotal': '5600.00',
            'delivery_charge': '500.00',
            'security_deposit': '1000.00',
        }, format='json')
        duration = time.time() - start_time

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.json()
        self.assertEqual(data['message'], 'Order created successfully.')
        self.assertIn('order', data)
        self.assertTrue(data['order']['order_id'].startswith('PK-'))
        # Must execute within 1.5 seconds locally even if external services are unconfigured / offline
        self.assertLess(duration, 1.5, f"Order creation took {duration:.2f}s, exceeding fast threshold.")




