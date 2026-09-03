"""
WhatsApp Cloud API integration for sending notifications.
"""
import json
import logging
import urllib.request
import urllib.error
from decouple import config

logger = logging.getLogger(__name__)


class WhatsAppService:
    """
    Service for sending WhatsApp messages via Meta WhatsApp Cloud API.
    Uses standard library urllib to avoid third-party dependencies while
    handling failures gracefully.
    """

    def __init__(self):
        self.access_token = config('WHATSAPP_ACCESS_TOKEN', default='')
        self.phone_number_id = config('WHATSAPP_PHONE_NUMBER_ID', default='')
        self.api_version = config('WHATSAPP_API_VERSION', default='v21.0')
        self.api_url = (
            f'https://graph.facebook.com/{self.api_version}/'
            f'{self.phone_number_id}/messages'
        )

    def _normalize_phone(self, recipient_phone):
        digits = ''.join(ch for ch in str(recipient_phone or '') if ch.isdigit())
        if digits.startswith('0'):
            digits = digits.lstrip('0')
        if len(digits) == 10:
            digits = f'977{digits}'
        return digits

    def _post_json(self, payload):
        """Perform POST request using standard library urllib."""
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
                return json.loads(res_body) if res_body else {'ok': True}
        except Exception as e:
            logger.error(f'WhatsApp API request failed: {str(e)}')
            return None

    def send_text_message(self, recipient_phone, message_body):
        """
        Send a simple text message via WhatsApp.
        Failures are logged and never raised to callers.
        """
        if not self.access_token or not self.phone_number_id:
            logger.warning('WhatsApp credentials not configured')
            return None

        to_number = self._normalize_phone(recipient_phone)
        if not to_number:
            logger.warning('WhatsApp recipient phone is empty')
            return None

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

        result = self._post_json(payload)
        if result:
            logger.info(f'WhatsApp message sent to {to_number}')
        return result

    def send_template_message(self, recipient_phone, template_name, variables=None):
        """Send a WhatsApp template message."""
        if not self.access_token or not self.phone_number_id:
            logger.warning('WhatsApp credentials not configured')
            return None

        to_number = self._normalize_phone(recipient_phone)
        if not to_number:
            return None

        payload = {
            'messaging_product': 'whatsapp',
            'recipient_type': 'individual',
            'to': to_number,
            'type': 'template',
            'template': {
                'name': template_name,
                'language': {
                    'code': 'en_US'
                },
            },
        }

        if variables:
            payload['template']['components'] = [
                {
                    'type': 'body',
                    'parameters': [
                        {'type': 'text', 'text': str(var)} for var in variables
                    ],
                }
            ]

        result = self._post_json(payload)
        if result:
            logger.info(f'WhatsApp template message sent to {to_number}')
        return result

    def send_order_confirmation(self, recipient_phone, order_data):
        """Send order confirmation WhatsApp message."""
        message = f"""🏔️ *PeakKit Reservation Confirmed*

Hello {order_data.get('customer_name', 'there')},

Your *{order_data.get('destination', 'Adventure')} Adventure Kit* has been reserved.

📋 *Order Details:*
• Order ID: {order_data.get('order_id')}
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
