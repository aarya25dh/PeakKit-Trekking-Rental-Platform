from django.core.management.base import BaseCommand
from rentals.services import whatsapp_service


class Command(BaseCommand):
    help = 'Test WhatsApp Cloud API integration by sending a test message'

    def add_arguments(self, parser):
        parser.add_argument(
            '--phone',
            type=str,
            default='9860467948',
            help='Recipient phone number (e.g. 9860467948 or 9779860467948)'
        )
        parser.add_argument(
            '--message',
            type=str,
            default='PeakKit WhatsApp Cloud API test message.',
            help='Text message to send'
        )
        parser.add_argument(
            '--status',
            type=str,
            choices=['pending', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
            help='Test sending a specific order status message'
        )
        parser.add_argument(
            '--order-id',
            type=str,
            default='PK-2026-000015',
            help='Order ID to use when testing status message'
        )

    def handle(self, *args, **options):
        phone = options['phone']
        message = options['message']
        status = options.get('status')
        order_id = options.get('order_id')

        self.stdout.write(f"Testing WhatsApp Cloud API...")
        self.stdout.write(f"Configured: {whatsapp_service.is_configured()}")
        self.stdout.write(f"API Version: {whatsapp_service.api_version}")
        self.stdout.write(f"Recipient: {phone} (normalized: {whatsapp_service._normalize_phone(phone)})")

        if not whatsapp_service.is_configured():
            self.stdout.write(self.style.ERROR("Error: WhatsApp credentials are not configured in settings/.env!"))
            return

        if status:
            self.stdout.write(f"Sending order status update for '{status}' (order {order_id})...")
            result = whatsapp_service.send_order_status_update(phone, order_id, status)
        else:
            self.stdout.write(f"Sending custom text message: '{message}'...")
            result = whatsapp_service.send_text_message(phone, message)

        self.stdout.write(f"Result: {result}")
        if result and result.get('success'):
            self.stdout.write(self.style.SUCCESS("✓ WhatsApp message dispatched successfully!"))
        else:
            err = result.get('error') if result else 'Unknown error'
            self.stdout.write(self.style.WARNING(f"WhatsApp dispatch response: {err}"))
