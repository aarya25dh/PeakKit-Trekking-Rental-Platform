from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from rentals.models import Order, DeliveryPartner
from rentals.status_engine import OrderStatusEngine


SAMPLE_ORDERS = [
    {
        'seed_key': 'SEED-01',
        'destination': 'Everest Base Camp',
        'payment_method': 'card',
        'order_status': 'pending',
        'payment_status': 'pending',
        'subtotal': Decimal('8500.00'),
    },
    {
        'seed_key': 'SEED-02',
        'destination': 'Annapurna Base Camp',
        'payment_method': 'card',
        'order_status': 'confirmed',
        'payment_status': 'paid',
        'subtotal': Decimal('9200.00'),
    },
    {
        'seed_key': 'SEED-03',
        'destination': 'Mardi Himal',
        'payment_method': 'paypal',
        'order_status': 'packed',
        'payment_status': 'paid',
        'subtotal': Decimal('6400.00'),
    },
    {
        'seed_key': 'SEED-04',
        'destination': 'Langtang Valley',
        'payment_method': 'bank_transfer',
        'order_status': 'shipped',
        'payment_status': 'paid',
        'subtotal': Decimal('7800.00'),
    },
    {
        'seed_key': 'SEED-05',
        'destination': 'Mustang',
        'payment_method': 'cod',
        'order_status': 'out_for_delivery',
        'payment_status': 'cod_pending',
        'subtotal': Decimal('11000.00'),
    },
    {
        'seed_key': 'SEED-06',
        'destination': 'Shivapuri',
        'payment_method': 'card',
        'order_status': 'delivered',
        'payment_status': 'paid',
        'subtotal': Decimal('5100.00'),
    },
    {
        'seed_key': 'SEED-07',
        'destination': 'Nagarkot',
        'payment_method': 'paypal',
        'order_status': 'cancelled',
        'payment_status': 'refunded',
        'subtotal': Decimal('4300.00'),
    },
    {
        'seed_key': 'SEED-08',
        'destination': 'Gosaikunda',
        'payment_method': 'card',
        'order_status': 'packed',
        'payment_status': 'paid',
        'subtotal': Decimal('9900.00'),
    },
    {
        'seed_key': 'SEED-09',
        'destination': 'Poon Hill',
        'payment_method': 'cod',
        'order_status': 'confirmed',
        'payment_status': 'cod_pending',
        'subtotal': Decimal('7200.00'),
    },
    {
        'seed_key': 'SEED-10',
        'destination': 'Helambu',
        'payment_method': 'bank_transfer',
        'order_status': 'delivered',
        'payment_status': 'paid',
        'subtotal': Decimal('12500.00'),
    },
]


class Command(BaseCommand):
    help = 'Seed database with delivery partners and sample orders (idempotent)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting database seeding...'))

        self.create_delivery_partners()
        user = self.get_or_create_test_user()
        created_count, skipped_count = self.create_sample_orders(user)

        self.stdout.write(self.style.SUCCESS(f'Created {created_count} orders.'))
        self.stdout.write(self.style.SUCCESS(f'Skipped {skipped_count} existing orders.'))
        self.stdout.write(self.style.SUCCESS('✓ Database seeding completed successfully!'))

    def create_delivery_partners(self):
        """Create 5 delivery partners."""
        partners_data = [
            {
                'name': 'Hari Sharma',
                'phone_number': '9841234567',
                'whatsapp_number': '9841234567',
                'email': 'hari@peakkit.delivery',
                'vehicle_type': 'bike',
                'vehicle_number': 'KTM-001',
            },
            {
                'name': 'Ramesh Poudel',
                'phone_number': '9842234567',
                'whatsapp_number': '9842234567',
                'email': 'ramesh@peakkit.delivery',
                'vehicle_type': 'bike',
                'vehicle_number': 'BAJAJ-002',
            },
            {
                'name': 'Priya Tamang',
                'phone_number': '9843234567',
                'whatsapp_number': '9843234567',
                'email': 'priya@peakkit.delivery',
                'vehicle_type': 'scooter',
                'vehicle_number': 'SCOOTY-003',
            },
            {
                'name': 'Suresh Gurung',
                'phone_number': '9844234567',
                'whatsapp_number': '9844234567',
                'email': 'suresh@peakkit.delivery',
                'vehicle_type': 'car',
                'vehicle_number': 'MARUTI-004',
            },
            {
                'name': 'Laxmi Rai',
                'phone_number': '9845234567',
                'whatsapp_number': '9845234567',
                'email': 'laxmi@peakkit.delivery',
                'vehicle_type': 'van',
                'vehicle_number': 'HYUNDAI-005',
            },
        ]

        created_count = 0
        for partner_data in partners_data:
            partner, created = DeliveryPartner.objects.get_or_create(
                phone_number=partner_data['phone_number'],
                defaults=partner_data
            )
            if created:
                created_count += 1
                self.stdout.write(f"✓ Created delivery partner: {partner.name}")

        self.stdout.write(self.style.SUCCESS(f'Total delivery partners created: {created_count}'))

    def get_or_create_test_user(self):
        """Get or create a test user."""
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'testuser@peakkit.com',
                'first_name': 'Test',
                'last_name': 'User',
            }
        )

        if created:
            user.set_password('Test@1234')
            user.save()
            self.stdout.write(f"✓ Created test user: {user.email}")

        return user

    def create_sample_orders(self, user):
        """Create sample orders without duplicating existing seed rows."""
        partners = list(DeliveryPartner.objects.all())
        created_count = 0
        skipped_count = 0

        for index, sample in enumerate(SAMPLE_ORDERS):
            seed_key = sample['seed_key']
            order_status = sample['order_status']
            payment_status = sample['payment_status']
            needs_txn = payment_status in ('paid', 'cod_pending')

            existing = Order.objects.filter(customer=user, landmark=seed_key).first()
            if existing:
                skipped_count += 1
                OrderStatusEngine.on_order_created(existing, send_external=False)
                self.stdout.write(f"↷ Skipped existing order {existing.order_id} ({seed_key})")
                continue

            defaults = {
                'customer_phone': '9841234567',
                'customer_email': user.email,
                'destination': sample['destination'],
                'address': 'Thamel, Kathmandu',
                'payment_method': sample['payment_method'],
                'payment_status': payment_status,
                'order_status': order_status,
                'subtotal': sample['subtotal'],
                'delivery_charge': Decimal('0') if order_status == 'cancelled' else Decimal('500'),
                'security_deposit': Decimal('0') if order_status == 'cancelled' else Decimal('1000'),
                'estimated_delivery': timezone.now() + timedelta(hours=8 + index),
                'return_date': timezone.now() + timedelta(days=7 + index) if order_status != 'cancelled' else None,
                'delivery_partner': partners[index % len(partners)] if partners and order_status != 'pending' else None,
            }

            if needs_txn:
                defaults['transaction_id'] = Order.generate_transaction_id()

            order, created = Order.objects.get_or_create(
                customer=user,
                landmark=seed_key,
                defaults=defaults,
            )

            if not created:
                skipped_count += 1
                OrderStatusEngine.on_order_created(order, send_external=False)
                self.stdout.write(f"↷ Skipped existing order {order.order_id} ({seed_key})")
                continue

            if created and needs_txn and not order.transaction_id:
                order.transaction_id = Order.generate_transaction_id()
                order.save(update_fields=['transaction_id', 'updated_at'])

            OrderStatusEngine.on_order_created(order, send_external=False)
            created_count += 1
            status_display = dict(Order.ORDER_STATUS_CHOICES).get(order_status, order_status)
            self.stdout.write(f"✓ Created order {order.order_id} - Status: {status_display}")

        return created_count, skipped_count
