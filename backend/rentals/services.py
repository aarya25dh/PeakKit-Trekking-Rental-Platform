"""
WhatsApp Cloud API integration for sending notifications.
"""
import json
import logging
import urllib.request
import urllib.error
from django.conf import settings
from decouple import config

logger = logging.getLogger(__name__)


class WhatsAppService:
    """
    Service for sending WhatsApp messages via Meta WhatsApp Cloud API.
    Uses standard library urllib to avoid external dependencies.
    All errors are logged safely without exposing access tokens.
    """

    def __init__(self):
        self.access_token = (
            getattr(settings, 'WHATSAPP_ACCESS_TOKEN', None)
            or config('WHATSAPP_ACCESS_TOKEN', default='')
        )
        self.phone_number_id = (
            getattr(settings, 'WHATSAPP_PHONE_NUMBER_ID', None)
            or config('WHATSAPP_PHONE_NUMBER_ID', default='')
        )
        self.api_version = (
            getattr(settings, 'WHATSAPP_API_VERSION', None)
            or config('WHATSAPP_API_VERSION', default='v23.0')
        )
        self.api_url = (
            f'https://graph.facebook.com/{self.api_version}/'
            f'{self.phone_number_id}/messages'
        )

    def is_configured(self):
        """Check whether credentials are provided."""
        return bool(self.access_token and self.phone_number_id)

    def _normalize_phone(self, recipient_phone):
        """
        Normalize phone numbers to international format without + or spaces.
        Example for Nepal: 9860467948 -> 9779860467948.
        """
        if not recipient_phone:
            return None
        digits = ''.join(ch for ch in str(recipient_phone) if ch.isdigit())
        if digits.startswith('0'):
            digits = digits.lstrip('0')
        if len(digits) == 10:
            digits = f'977{digits}'
        return digits if digits else None

    def _post_json(self, payload):
        """
        Perform POST request to Meta WhatsApp Cloud API.
        Never raises exceptions to callers; logs sanitized errors.
        """
        if not self.is_configured():
            logger.warning('WhatsApp credentials not configured; skipping dispatch.')
            return {'success': False, 'error': 'not_configured'}

        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            self.api_url,
            data=data,
            headers={
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json',
            },
            method='POST',
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                res_body = response.read().decode('utf-8')
                parsed = json.loads(res_body) if res_body else {'ok': True}
                logger.info(f"WhatsApp message sent successfully to {payload.get('to')}")
                return {'success': True, 'data': parsed}
        except urllib.error.HTTPError as e:
            try:
                err_body = e.read().decode('utf-8')
                err_json = json.loads(err_body)
                err_msg = err_json.get('error', {}).get('message', str(e))
                err_code = err_json.get('error', {}).get('code', e.code)
            except Exception:
                err_msg = str(e)
                err_code = e.code
            logger.error(f"WhatsApp API HTTP error {err_code}: {err_msg}")
            return {'success': False, 'error': err_msg, 'code': err_code}
        except urllib.error.URLError as e:
            logger.error(f"WhatsApp network connection error: {e.reason}")
            return {'success': False, 'error': str(e.reason)}
        except Exception as e:
            logger.error(f"Unexpected error in WhatsApp dispatch: {str(e)}")
            return {'success': False, 'error': str(e)}

    def send_text_message(self, recipient_phone, message_body):
        """
        Send a text message via WhatsApp.
        Returns a dictionary indicating success and response details.
        """
        to_number = self._normalize_phone(recipient_phone)
        if not to_number:
            logger.warning(f"WhatsApp dispatch skipped: invalid recipient phone '{recipient_phone}'")
            return {'success': False, 'error': 'invalid_phone'}

        payload = {
            'messaging_product': 'whatsapp',
            'recipient_type': 'individual',
            'to': to_number,
            'type': 'text',
            'text': {
                'preview_url': False,
                'body': message_body,
            },
        }

        return self._post_json(payload)

    def send_order_status_update(self, recipient_phone, order_id, status, order_data=None):
        """
        Send order status update WhatsApp message for transitions:
        pending, confirmed, shipped, out_for_delivery, delivered, cancelled.
        """
        status_messages = {
            'pending': f"Your PeakKit reservation {order_id} has been received and is pending confirmation.",
            'confirmed': f"Your PeakKit order {order_id} has been confirmed.",
            'shipped': f"Your PeakKit order {order_id} has been shipped and is on its way.",
            'out_for_delivery': f"Your PeakKit order {order_id} is out for delivery.",
            'delivered': f"Your PeakKit order {order_id} has been delivered successfully.",
            'cancelled': f"Your PeakKit order {order_id} has been cancelled.",
        }
        status_clean = str(status).lower()
        message = status_messages.get(
            status_clean,
            f"Your PeakKit order {order_id} status is now {status_clean.replace('_', ' ').title()}."
        )
        return self.send_text_message(recipient_phone, message)

    def send_template_message(self, recipient_phone, template_name, variables=None):
        """Send a WhatsApp template message."""
        to_number = self._normalize_phone(recipient_phone)
        if not to_number:
            return {'success': False, 'error': 'invalid_phone'}

        payload = {
            'messaging_product': 'whatsapp',
            'recipient_type': 'individual',
            'to': to_number,
            'type': 'template',
            'template': {
                'name': template_name,
                'language': {'code': 'en_US'},
            },
        }

        if variables:
            payload['template']['components'] = [
                {
                    'type': 'body',
                    'parameters': [{'type': 'text', 'text': str(var)} for var in variables],
                }
            ]

        return self._post_json(payload)

    def send_order_confirmation(self, recipient_phone, order_data):
        """Send order confirmation WhatsApp message."""
        rental_period_str = order_data.get('rental_period', 'N/A')
        rental_days_str = order_data.get('rental_days', 7)
        return_date_str = order_data.get('return_date_display', order_data.get('return_date', 'N/A'))

        message = f"""🏔️ *PeakKit Reservation Confirmed*

Hello {order_data.get('customer_name', 'there')},

Your *{order_data.get('destination', 'Adventure')} Adventure Kit* has been reserved.

📋 *Order Details:*
• Order ID: {order_data.get('order_id')}
• Rental Period: {rental_period_str} ({rental_days_str} Rental Days)
• Return Date: {return_date_str}
• Amount Paid: NPR {order_data.get('total_amount')}
• Status: Reservation Confirmed
• Destination: {order_data.get('destination')}

Track your order inside *PeakKit* app.

Thank you for booking with us! 🙏"""
        return self.send_text_message(recipient_phone, message)

    def send_payment_confirmation(self, recipient_phone, order_data):
        """Send payment confirmation message."""
        message = f"""✅ *Payment Received*

Hello {order_data.get('customer_name', 'there')},

Your payment for Order *{order_data.get('order_id')}* has been successfully received!

💳 *Payment Details:*
• Amount: NPR {order_data.get('total_amount')}
• Method: {order_data.get('payment_method')}
• Status: Confirmed

Your gear is being prepared. We'll notify you soon! 📦"""
        return self.send_text_message(recipient_phone, message)

    def send_rider_assigned(self, recipient_phone, order_data):
        """Send rider assigned notification."""
        message = f"""🏍️ *Rider Assigned*

Hello {order_data.get('customer_name', 'there')},

Great news! Your delivery rider has been assigned.

👤 *Rider Details:*
• Name: {order_data.get('rider_name', 'Coming soon')}
• Phone: {order_data.get('rider_phone', 'Coming soon')}
• Vehicle: {order_data.get('vehicle_type', 'Motorcycle')}
• Rating: {order_data.get('rider_rating', '5.0')} ⭐

Your order *{order_data.get('order_id')}* is on the way! 📍"""
        return self.send_text_message(recipient_phone, message)

    def send_delivery_confirmation(self, recipient_phone, order_data):
        """Send delivery confirmation message."""
        message = f"""📦 *Order Delivered*

Hello {order_data.get('customer_name', 'there')},

Your order *{order_data.get('order_id')}* has been successfully delivered!

✅ *Delivery Details:*
• Destination: {order_data.get('destination')}
• Time: {order_data.get('delivery_time', 'Today')}
• Condition: Perfect ✨

Enjoy your adventure! For returns, visit PeakKit after {order_data.get('return_date', '7 days')}.

Questions? Contact us anytime! 📞"""
        return self.send_text_message(recipient_phone, message)

    def send_return_reminder(self, recipient_phone, order_data):
        """Send return reminder WhatsApp message for rental gear."""
        return_date_str = order_data.get('return_date', 'your rental return date')
        message = f"""⏰ *PeakKit Gear Return Reminder*

Hello {order_data.get('customer_name', 'there')},

We hope you had a great expedition! This is a reminder that your rental gear for Order *{order_data.get('order_id')}* is scheduled for return on *{return_date_str}*.

Please ensure all gear is packed and ready for return pickup. Thank you for renting with PeakKit! 🏔️"""
        return self.send_text_message(recipient_phone, message)

    def send_rider_notification(self, rider_phone, order_data):
        """Send notification to delivery rider."""
        message = f"""📬 *New Delivery Assigned*

Order ID: *{order_data.get('order_id')}*

👤 *Customer Details:*
• Name: {order_data.get('customer_name')}
• Phone: {order_data.get('customer_phone')}

📍 *Delivery Address:*
{order_data.get('address', 'TBD')}
Landmark: {order_data.get('landmark', 'N/A')}

🎒 *Destination:* {order_data.get('destination')}

💵 *Payment:*
• Method: {order_data.get('payment_method')}
• Amount: NPR {order_data.get('total_amount')}
{"• COD Amount: NPR " + str(order_data.get('cod_amount')) if order_data.get('payment_method') == 'Cash on Delivery' or order_data.get('cod_amount') else ''}

🏢 *Pickup Location:* PeakKit Warehouse, Kathmandu

Please confirm receipt of this order. 🙏"""
        return self.send_text_message(rider_phone, message)


whatsapp_service = WhatsAppService()

_SENT_CONFIRMATION_ORDER_IDS = set()


def send_order_confirmation_whatsapp(order, request=None):
    """
    Immediately send order confirmation WhatsApp notification to customer.
    Phone priority:
    1. order.customer_phone
    2. request.user.profile.phone_number
    3. order.customer.profile.phone_number
    Normalizes Nepal number to 977XXXXXXXXX.
    Does not send duplicate messages if confirmation was already sent for this order.
    Logs success/failure.
    """
    order_id = getattr(order, 'order_id', None)
    if not order_id:
        logger.warning("Cannot send WhatsApp confirmation: order has no order_id")
        return {'success': False, 'error': 'missing_order_id'}

    # Prevent duplicate confirmation for the same order
    from django.core.cache import cache
    cache_key = f"whatsapp_order_confirmation_sent_{order_id}"
    if order_id in _SENT_CONFIRMATION_ORDER_IDS or cache.get(cache_key):
        logger.info(f"WhatsApp order confirmation already sent for order {order_id}; skipping duplicate.")
        return {'success': True, 'skipped': True, 'reason': 'already_sent'}

    # 1. Use order.customer_phone
    phone = getattr(order, 'customer_phone', None)

    # 2. Fallback to request.user.profile.phone_number
    if not phone and request and hasattr(request, 'user') and request.user.is_authenticated:
        try:
            phone = request.user.profile.phone_number
        except Exception:
            pass

    # 3. Fallback to order.customer.profile.phone_number
    if not phone and hasattr(order, 'customer') and order.customer:
        try:
            phone = order.customer.profile.phone_number
        except Exception:
            pass

    if not phone:
        logger.warning(f"Skipping WhatsApp confirmation for order {order_id}: no customer phone found")
        return {'success': False, 'error': 'no_phone'}

    # Normalize Nepal number to 977XXXXXXXXX
    normalized_phone = whatsapp_service._normalize_phone(phone)
    if not normalized_phone:
        logger.warning(f"Skipping WhatsApp confirmation for order {order_id}: invalid phone '{phone}'")
        return {'success': False, 'error': 'invalid_phone'}

    # Prepare notification data
    from rentals.status_engine import OrderStatusEngine
    notification_data = OrderStatusEngine._prepare_notification_data(order)

    # Dispatch WhatsApp message
    result = whatsapp_service.send_order_confirmation(normalized_phone, notification_data)

    if result and result.get('success'):
        _SENT_CONFIRMATION_ORDER_IDS.add(order_id)
        cache.set(cache_key, True, timeout=86400 * 7)
        logger.info(f"WhatsApp order confirmation sent successfully for order {order_id} to {normalized_phone}: {result}")
    else:
        err = result.get('error') if result else 'unknown'
        logger.error(f"WhatsApp order confirmation failed for order {order_id} to {normalized_phone}: {err}")

    return result
