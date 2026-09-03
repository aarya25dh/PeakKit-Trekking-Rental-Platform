"""
Auto status engine for handling order status changes with notifications.
"""
import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

from rentals.models import TrackingEvent, DeliveryPartner
from rentals.services import whatsapp_service
from users.models import Notification

logger = logging.getLogger(__name__)


class OrderStatusEngine:
    """
    Handles order status updates and cascading notifications.
    """

    TIMELINE = [
        {
            'key': 'reservation',
            'title': 'Reservation Confirmed',
            'icon': 'reservation',
            'description': 'Your reservation has been confirmed.',
            'statuses': [
                'pending', 'confirmed', 'packed', 'shipped',
                'out_for_delivery', 'delivered', 'cancelled',
            ],
        },
        {
            'key': 'payment',
            'title': 'Payment Verified',
            'icon': 'payment',
            'description': 'Payment has been successfully received.',
            'statuses': [
                'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered',
            ],
            'payment_statuses': ['paid', 'cod_pending'],
        },
        {
            'key': 'sanitize',
            'title': 'Gear Sanitized',
            'icon': 'sanitize',
            'description': 'Your gear has been sanitized.',
            'statuses': ['packed', 'shipped', 'out_for_delivery', 'delivered'],
        },
        {
            'key': 'packed',
            'title': 'Packed At PeakKit Warehouse',
            'icon': 'pack',
            'description': 'Your gear has been packed at PeakKit warehouse.',
            'statuses': ['packed', 'shipped', 'out_for_delivery', 'delivered'],
        },
        {
            'key': 'rider',
            'title': 'Rider Assigned',
            'icon': 'rider',
            'description': 'Your delivery rider has been assigned.',
            'statuses': ['shipped', 'out_for_delivery', 'delivered'],
        },
        {
            'key': 'out_for_delivery',
            'title': 'Out For Delivery',
            'icon': 'delivery',
            'description': 'Your order is on the way to your destination.',
            'statuses': ['out_for_delivery', 'delivered'],
        },
        {
            'key': 'delivered',
            'title': 'Delivered',
            'icon': 'delivered',
            'description': 'Your order has been successfully delivered.',
            'statuses': ['delivered'],
        },
        {
            'key': 'return',
            'title': 'Return Reminder',
            'icon': 'return',
            'description': 'Please return your rental gear by the due date.',
            'statuses': ['delivered'],
            'rentals_only': True,
        },
    ]

    STATUS_NOTIFICATIONS = {
        'confirmed': {
            'title': 'Reservation Confirmed',
            'message': 'Your reservation {order_id} has been confirmed.',
            'notification_type': 'reservation',
        },
        'packed': {
            'title': 'Gear Packed',
            'message': 'Your gear has been packed.',
            'notification_type': 'delivery',
        },
        'shipped': {
            'title': 'Order Shipped',
            'message': 'Your order has been shipped.',
            'notification_type': 'delivery',
        },
        'out_for_delivery': {
            'title': 'Out for Delivery',
            'message': 'Your rider is on the way.',
            'notification_type': 'delivery',
        },
        'delivered': {
            'title': 'Order Delivered',
            'message': 'Order delivered successfully.',
            'notification_type': 'delivery',
        },
        'cancelled': {
            'title': 'Reservation Cancelled',
            'message': 'Reservation cancelled.',
            'notification_type': 'system',
        },
    }

    EMAIL_TEMPLATES = {
        'confirmed': 'order_confirmation.html',
        'paid': 'order_payment_confirmed.html',
        'packed': 'order_packed.html',
        'shipped': 'rider_assigned.html',
        'out_for_delivery': 'order_out_for_delivery.html',
        'delivered': 'order_delivered.html',
        'cancelled': 'order_cancelled.html',
        'return': 'order_return_reminder.html',
    }

    ASSIGN_PARTNER_STATUSES = ('confirmed', 'packed', 'shipped', 'out_for_delivery')
    RELEASE_PARTNER_STATUSES = ('delivered', 'cancelled')

    @staticmethod
    def on_order_created(order, send_external=True):
        """Create reservation artifacts after a new order is saved."""
        OrderStatusEngine.sync_tracking_events(order)
        OrderStatusEngine._ensure_notification(
            order,
            notification_type='reservation',
            title='Reservation Confirmed',
            message=f'Your reservation {order.order_id} has been confirmed.',
        )
        OrderStatusEngine._create_status_notifications(order, order.order_status)

        if order.order_status in OrderStatusEngine.ASSIGN_PARTNER_STATUSES:
            OrderStatusEngine.assign_delivery_partner(order)

        OrderStatusEngine.sync_tracking_events(order)
        OrderStatusEngine._notify_status_side_effects(order, order.order_status, send_external)
        return order

    @staticmethod
    def update_order_status(order, new_status, payment_status=None, delivery_partner=None, send_external=True):
        """
        Update order status and trigger tracking, notifications, email, and WhatsApp.
        External send failures never roll back the status change.
        """
        old_status = order.order_status
        order.order_status = new_status

        if payment_status:
            order.payment_status = payment_status

        if delivery_partner:
            order.delivery_partner = delivery_partner

        if new_status in OrderStatusEngine.ASSIGN_PARTNER_STATUSES:
            OrderStatusEngine.assign_delivery_partner(order, persist=False)
        elif new_status in OrderStatusEngine.RELEASE_PARTNER_STATUSES:
            OrderStatusEngine.release_delivery_partner(order, persist=False)

        order.save()

        OrderStatusEngine.sync_tracking_events(order)
        OrderStatusEngine._create_status_notifications(order, new_status)

        if send_external:
            OrderStatusEngine._notify_status_side_effects(order, new_status, send_external=True)

        logger.info(f'Order {order.order_id} status updated from {old_status} to {new_status}')
        return True

    @staticmethod
    def sync_tracking_events(order):
        """Create missing timeline events for the current order status. Never duplicate titles."""
        for event in OrderStatusEngine.TIMELINE:
            if order.order_status not in event['statuses']:
                continue
            if event.get('payment_statuses') and order.payment_status not in event['payment_statuses']:
                continue
            if event.get('rentals_only') and not order.return_date:
                continue

            TrackingEvent.objects.get_or_create(
                order=order,
                title=event['title'],
                defaults={
                    'description': event['description'],
                    'icon': event['icon'],
                    'completed': True,
                },
            )

        if order.order_status == 'cancelled':
            TrackingEvent.objects.get_or_create(
                order=order,
                title='Reservation cancelled',
                defaults={
                    'description': 'Your reservation has been cancelled.',
                    'icon': 'reservation',
                    'completed': True,
                },
            )

    @staticmethod
    def assign_delivery_partner(order, persist=True):
        """Assign the first available partner when the order is confirmed or packed."""
        if order.delivery_partner_id:
            partner = order.delivery_partner
            if partner and partner.available:
                partner.available = False
                partner.save(update_fields=['available', 'updated_at'])
            return order.delivery_partner

        partner = DeliveryPartner.objects.filter(available=True).first()
        if not partner:
            return None

        partner.available = False
        partner.save(update_fields=['available', 'updated_at'])
        order.delivery_partner = partner
        if persist:
            order.save(update_fields=['delivery_partner', 'updated_at'])
        return partner

    @staticmethod
    def release_delivery_partner(order, persist=True):
        partner = order.delivery_partner
        if not partner:
            return
        update_fields = ['available', 'updated_at']
        partner.available = True
        if order.order_status == 'delivered':
            partner.total_deliveries = (partner.total_deliveries or 0) + 1
            update_fields.append('total_deliveries')
        partner.save(update_fields=update_fields)
        if persist:
            order.save(update_fields=['updated_at'])

    @staticmethod
    def _create_status_notifications(order, new_status):
        config = OrderStatusEngine.STATUS_NOTIFICATIONS.get(new_status)
        if config:
            OrderStatusEngine._ensure_notification(
                order,
                notification_type=config['notification_type'],
                title=config['title'],
                message=config['message'].format(order_id=order.order_id),
            )

        if order.payment_status in ('paid', 'cod_pending') and new_status in (
            'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered',
        ):
            OrderStatusEngine._ensure_notification(
                order,
                notification_type='payment',
                title='Payment Successful',
                message=f'Payment received for {order.order_id}.',
            )

        if new_status in ('shipped', 'out_for_delivery') and order.delivery_partner:
            OrderStatusEngine._ensure_notification(
                order,
                notification_type='delivery',
                title='Rider Assigned',
                message=f'{order.delivery_partner.name} has been assigned to {order.order_id}.',
            )

        if new_status == 'delivered' and order.return_date:
            OrderStatusEngine._ensure_notification(
                order,
                notification_type='system',
                title='Return Reminder',
                message=f'Please return your rental gear by {order.return_date.strftime("%Y-%m-%d")}.',
            )

    @staticmethod
    def _ensure_notification(order, notification_type, title, message):
        notification, _created = Notification.objects.get_or_create(
            user=order.customer,
            related_order_id=order.order_id,
            title=title,
            defaults={
                'notification_type': notification_type,
                'message': message,
                'is_read': False,
            },
        )
        return notification

    @staticmethod
    def _notify_status_side_effects(order, status, send_external=True):
        if not send_external:
            return

        notification_data = OrderStatusEngine._prepare_notification_data(order)

        email_key = status
        if status == 'confirmed':
            email_key = 'confirmed'
        template_name = OrderStatusEngine.EMAIL_TEMPLATES.get(email_key)
        if template_name:
            OrderStatusEngine._send_email_notification(order, template_name, notification_data)

        if status == 'confirmed' and order.payment_status in ('paid', 'cod_pending'):
            OrderStatusEngine._send_email_notification(
                order, OrderStatusEngine.EMAIL_TEMPLATES['paid'], notification_data
            )

        if status == 'delivered' and order.return_date:
            OrderStatusEngine._send_email_notification(
                order, OrderStatusEngine.EMAIL_TEMPLATES['return'], notification_data
            )

        OrderStatusEngine._send_customer_whatsapp(order, status, notification_data)

        if status in ('shipped', 'out_for_delivery') and order.delivery_partner:
            OrderStatusEngine._send_rider_whatsapp(order, notification_data)

    @staticmethod
    def _prepare_notification_data(order):
        """Prepare data for notifications."""
        return {
            'order_id': order.order_id,
            'customer_name': f"{order.customer.first_name} {order.customer.last_name}".strip() or order.customer.email,
            'customer_phone': order.customer_phone,
            'destination': order.destination,
            'address': order.address,
            'landmark': order.landmark,
            'items': f"{order.destination} Adventure Kit",
            'total_amount': order.total_amount,
            'subtotal': order.subtotal,
            'delivery_charge': order.delivery_charge,
            'security_deposit': order.security_deposit,
            'payment_method': order.get_payment_method_display(),
            'order_status': order.get_order_status_display(),
            'payment_status': order.get_payment_status_display(),
            'rider_name': order.delivery_partner.name if order.delivery_partner else 'N/A',
            'rider_phone': order.delivery_partner.phone_number if order.delivery_partner else 'N/A',
            'vehicle_type': order.delivery_partner.get_vehicle_type_display() if order.delivery_partner else 'N/A',
            'rider_rating': order.delivery_partner.rating if order.delivery_partner else '5.0',
            'estimated_delivery': order.estimated_delivery.strftime('%Y-%m-%d %H:%M') if order.estimated_delivery else 'N/A',
            'return_date': order.return_date.strftime('%Y-%m-%d') if order.return_date else 'N/A',
            'transaction_id': order.transaction_id or 'N/A',
            'cod_amount': order.total_amount if order.payment_method == 'cod' else None,
        }

    @staticmethod
    def _send_email_notification(order, template_name, context):
        """Send email notification. Failures are logged and never raised."""
        try:
            email_context = dict(context)
            email_context['order'] = order
            email_context['frontend_url'] = settings.FRONTEND_URL

            html_message = render_to_string(f'emails/{template_name}', email_context)

            send_mail(
                subject=f'PeakKit Order Update: {order.order_id}',
                message='',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.customer_email],
                html_message=html_message,
                fail_silently=True,
            )
            logger.info(f'Email sent for order {order.order_id} ({template_name})')
        except Exception as e:
            logger.error(f'Failed to send email for order {order.order_id}: {str(e)}')

    @staticmethod
    def _send_customer_whatsapp(order, status, notification_data):
        """Send WhatsApp notification to customer."""
        try:
            if not order.customer_phone:
                return
            if status in ('pending', 'confirmed'):
                whatsapp_service.send_order_confirmation(order.customer_phone, notification_data)
            if status == 'paid' or (
                status == 'confirmed' and order.payment_status in ('paid', 'cod_pending')
            ):
                whatsapp_service.send_payment_confirmation(order.customer_phone, notification_data)
            elif status == 'shipped':
                whatsapp_service.send_rider_assigned(order.customer_phone, notification_data)
            elif status == 'delivered':
                whatsapp_service.send_delivery_confirmation(order.customer_phone, notification_data)
            elif status not in ('pending', 'confirmed', 'cancelled'):
                message = (
                    f"PeakKit {order.order_id}: Your order status is now "
                    f"{order.get_order_status_display()}."
                )
                whatsapp_service.send_text_message(order.customer_phone, message)
        except Exception as e:
            logger.error(f'Failed to send WhatsApp to customer for order {order.order_id}: {str(e)}')

    @staticmethod
    def _send_rider_whatsapp(order, notification_data):
        """Send WhatsApp notification to rider."""
        try:
            if not order.delivery_partner:
                return
            phone = order.delivery_partner.whatsapp_number or order.delivery_partner.phone_number
            whatsapp_service.send_rider_notification(phone, notification_data)
        except Exception as e:
            logger.error(f'Failed to send WhatsApp to rider for order {order.order_id}: {str(e)}')
