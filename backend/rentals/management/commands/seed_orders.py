from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from rentals.models import Order, DeliveryPartner, Gear, RentalReservation
from rentals.status_engine import OrderStatusEngine
from users.models import Profile, Notification


REALISTIC_DEMO_USERS = [
    {
        'username': 'prakash.shrestha',
        'email': 'prakash.shrestha@gmail.com',
        'first_name': 'Prakash',
        'last_name': 'Shrestha',
        'phone_number': '9841239876',
        'city': 'Kathmandu',
        'address': 'New Baneshwor, Kathmandu',
    },
    {
        'username': 'sita.gurung',
        'email': 'sita.gurung@gmail.com',
        'first_name': 'Sita',
        'last_name': 'Gurung',
        'phone_number': '9856012345',
        'city': 'Pokhara',
        'address': 'Lakeside-6, Pokhara',
    },
    {
        'username': 'nima.sherpa',
        'email': 'nima.sherpa@gmail.com',
        'first_name': 'Nima',
        'last_name': 'Sherpa',
        'phone_number': '9842098765',
        'city': 'Kathmandu',
        'address': 'Boudha, Kathmandu',
    },
    {
        'username': 'riya.karki',
        'email': 'riya.karki@gmail.com',
        'first_name': 'Riya',
        'last_name': 'Karki',
        'phone_number': '9861234567',
        'city': 'Lalitpur',
        'address': 'Jhamsikhel, Lalitpur',
    },
    {
        'username': 'aarav.rai',
        'email': 'aarav.rai@gmail.com',
        'first_name': 'Aarav',
        'last_name': 'Rai',
        'phone_number': '9843987654',
        'city': 'Bhaktapur',
        'address': 'Sallaghari, Bhaktapur',
    },
]

DELIVERY_PARTNERS_DATA = [
    {
        'name': 'Hari Sharma',
        'phone_number': '9841234567',
        'whatsapp_number': '9841234567',
        'email': 'hari.sharma@peakkit.delivery',
        'vehicle_type': 'bike',
        'vehicle_number': 'BA 2 PA 1234',
        'current_location': 'Kathmandu Warehouse',
    },
    {
        'name': 'Ramesh Poudel',
        'phone_number': '9842234567',
        'whatsapp_number': '9842234567',
        'email': 'ramesh.poudel@peakkit.delivery',
        'vehicle_type': 'bike',
        'vehicle_number': 'GA 1 PA 5678',
        'current_location': 'Pokhara Hub',
    },
    {
        'name': 'Priya Tamang',
        'phone_number': '9843234567',
        'whatsapp_number': '9843234567',
        'email': 'priya.tamang@peakkit.delivery',
        'vehicle_type': 'scooter',
        'vehicle_number': 'BA 3 PA 9012',
        'current_location': 'Lalitpur Hub',
    },
    {
        'name': 'Suresh Gurung',
        'phone_number': '9844234567',
        'whatsapp_number': '9844234567',
        'email': 'suresh.gurung@peakkit.delivery',
        'vehicle_type': 'car',
        'vehicle_number': 'BA 1 CHA 3456',
        'current_location': 'Bhaktapur Hub',
    },
    {
        'name': 'Laxmi Rai',
        'phone_number': '9845234567',
        'whatsapp_number': '9845234567',
        'email': 'laxmi.rai@peakkit.delivery',
        'vehicle_type': 'van',
        'vehicle_number': 'NA 1 KHA 7890',
        'current_location': 'Chitwan Hub',
    },
]

SAMPLE_ORDERS = [
    {
        'seed_key': 'SEED-01',
        'destination': 'Everest Base Camp',
        'gear_id': 'kit-everest-base-camp',
        'address': 'Thamel, Kathmandu',
        'landmark': 'Near Garden of Dreams',
        'payment_method': 'card',
        'order_status': 'pending',
        'reservation_status': 'Upcoming',
        'payment_status': 'pending',
        'rental_days': 14,
        'daily_rental_price': Decimal('892.86'),
        'subtotal': Decimal('12500.00'),
    },
    {
        'seed_key': 'SEED-02',
        'destination': 'Annapurna Base Camp',
        'gear_id': 'kit-annapurna-base-camp',
        'address': 'Lakeside, Pokhara',
        'landmark': 'Near Phewa Boat Point',
        'payment_method': 'esewa',
        'order_status': 'confirmed',
        'reservation_status': 'Active',
        'payment_status': 'paid',
        'rental_days': 10,
        'daily_rental_price': Decimal('890.00'),
        'subtotal': Decimal('8900.00'),
    },
    {
        'seed_key': 'SEED-03',
        'destination': 'Mardi Himal',
        'gear_id': 'kit-mardi-himal',
        'address': 'Sanepa, Lalitpur',
        'landmark': 'Near British School',
        'payment_method': 'khalti',
        'order_status': 'packed',
        'reservation_status': 'Active',
        'payment_status': 'paid',
        'rental_days': 5,
        'daily_rental_price': Decimal('1280.00'),
        'subtotal': Decimal('6400.00'),
    },
    {
        'seed_key': 'SEED-04',
        'destination': 'Langtang Valley',
        'gear_id': 'kit-langtang-valley',
        'address': 'Boudha, Kathmandu',
        'landmark': 'Near Stupa Gate 2',
        'payment_method': 'bank_transfer',
        'order_status': 'shipped',
        'reservation_status': 'Active',
        'payment_status': 'paid',
        'rental_days': 7,
        'daily_rental_price': Decimal('1114.29'),
        'subtotal': Decimal('7800.00'),
    },
    {
        'seed_key': 'SEED-05',
        'destination': 'Mustang',
        'gear_id': 'kit-mustang',
        'address': 'Jhamsikhel, Lalitpur',
        'landmark': 'Near Moksh',
        'payment_method': 'cod',
        'order_status': 'out_for_delivery',
        'reservation_status': 'Active',
        'payment_status': 'cod_pending',
        'rental_days': 21,
        'daily_rental_price': Decimal('666.67'),
        'subtotal': Decimal('14000.00'),
    },
    {
        'seed_key': 'SEED-06',
        'destination': 'Shivapuri',
        'gear_id': 'kit-shivapuri',
        'address': 'Budhanilkantha, Kathmandu',
        'landmark': 'Near Temple Entrance',
        'payment_method': 'card',
        'order_status': 'delivered',
        'reservation_status': 'Returned',
        'payment_status': 'paid',
        'rental_days': 3,
        'daily_rental_price': Decimal('1500.00'),
        'subtotal': Decimal('4500.00'),
    },
    {
        'seed_key': 'SEED-07',
        'destination': 'Nagarkot',
        'gear_id': 'kit-nagarkot',
        'address': 'Sallaghari, Bhaktapur',
        'landmark': 'Near Durbar Square Road',
        'payment_method': 'paypal',
        'order_status': 'cancelled',
        'reservation_status': 'Cancelled',
        'payment_status': 'refunded',
        'rental_days': 3,
        'daily_rental_price': Decimal('1400.00'),
        'subtotal': Decimal('4200.00'),
    },
    {
        'seed_key': 'SEED-08',
        'destination': 'Gosaikunda',
        'gear_id': 'kit-gosaikunda',
        'address': 'Lazimpat, Kathmandu',
        'landmark': 'Near Radisson Hotel',
        'payment_method': 'esewa',
        'order_status': 'packed',
        'reservation_status': 'Active',
        'payment_status': 'paid',
        'rental_days': 7,
        'daily_rental_price': Decimal('1357.14'),
        'subtotal': Decimal('9500.00'),
    },
    {
        'seed_key': 'SEED-09',
        'destination': 'Rara Lake',
        'gear_id': 'kit-rara-lake',
        'address': 'New Baneshwor, Kathmandu',
        'landmark': 'Near Parliament Building',
        'payment_method': 'bank_transfer',
        'order_status': 'confirmed',
        'reservation_status': 'Active',
        'payment_status': 'paid',
        'rental_days': 30,
        'daily_rental_price': Decimal('550.00'),
        'subtotal': Decimal('16500.00'),
    },
    {
        'seed_key': 'SEED-10',
        'destination': 'Poon Hill',
        'gear_id': 'kit-poon-hill',
        'address': 'Damside, Pokhara',
        'landmark': 'Near Tourist Bus Park',
        'payment_method': 'cod',
        'order_status': 'delivered',
        'reservation_status': 'Returned',
        'payment_status': 'paid',
        'rental_days': 10,
        'daily_rental_price': Decimal('720.00'),
        'subtotal': Decimal('7200.00'),
    },
]


class Command(BaseCommand):
    help = 'Seed database with realistic Nepal demo users, delivery partners, and orders for Aarya Dhungana (idempotent)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting database seeding...'))

        self.clean_placeholder_users()
        self.create_realistic_demo_users()
        self.create_delivery_partners()
        primary_user = self.get_or_create_primary_user()
        created_count, skipped_count = self.create_sample_orders(primary_user)

        self.stdout.write(self.style.SUCCESS(f'Created {created_count} orders.'))
        self.stdout.write(self.style.SUCCESS(f'Skipped {skipped_count} existing orders.'))
        self.stdout.write(self.style.SUCCESS('✓ Database seeding completed successfully!'))

    def get_or_create_primary_user(self):
        """
        Get or create primary customer: Aarya Dhungana (dhungana21@gmail.com, 9860467948).
        Merges existing user accounts if needed.
        """
        # Find all candidate users for Aarya
        candidates = list(User.objects.filter(email='dhungana21@gmail.com'))
        if not candidates:
            candidates = list(User.objects.filter(username__in=['aaryadhungana', 'aarya@test.com', 'aarya']))

        if not candidates:
            primary_user = User.objects.create_user(
                username='aaryadhungana',
                email='dhungana21@gmail.com',
                first_name='Aarya',
                last_name='Dhungana',
            )
            primary_user.set_password('Test@1234')
            primary_user.save()
        else:
            # Pick candidate with most orders or id=6
            primary_user = candidates[0]
            for c in candidates:
                if c.orders.count() > primary_user.orders.count():
                    primary_user = c

            # Merge others into primary_user
            for other in candidates:
                if other.id != primary_user.id:
                    Order.objects.filter(customer=other).update(customer=primary_user, customer_email=primary_user.email)
                    Notification.objects.filter(user=other).update(user=primary_user)
                    Profile.objects.filter(user=other).delete()
                    other.delete()

            # Clean any other profile holding the phone number
            Profile.objects.filter(phone_number='9860467948').exclude(user=primary_user).update(phone_number=None)

            primary_user.email = 'dhungana21@gmail.com'
            primary_user.first_name = 'Aarya'
            primary_user.last_name = 'Dhungana'
            primary_user.username = 'aaryadhungana'
            primary_user.save()

        # Update profile
        profile, _ = Profile.objects.get_or_create(user=primary_user)
        profile.phone_number = '9860467948'
        profile.email_verified = True
        profile.address = 'Thamel, Kathmandu'
        profile.city = 'Kathmandu'
        profile.province = 'Bagmati'
        profile.save()

        self.stdout.write(f"✓ Primary user active: {primary_user.first_name} {primary_user.last_name} ({primary_user.email}) - {profile.phone_number}")
        return primary_user

    def clean_placeholder_users(self):
        """Remove placeholder demo accounts with test.com or example.com domains."""
        placeholder_users = User.objects.filter(
            email__icontains='@example.com'
        ) | User.objects.filter(
            email__icontains='@test.com'
        ) | User.objects.filter(
            username__icontains='testuser'
        )

        for u in placeholder_users:
            if u.email == 'dhungana21@gmail.com':
                continue
            # Reassign any orders to primary user before deleting
            primary_user = User.objects.filter(email='dhungana21@gmail.com').first()
            if primary_user and primary_user.id != u.id:
                Order.objects.filter(customer=u).update(customer=primary_user, customer_email=primary_user.email)
                Notification.objects.filter(user=u).update(user=primary_user)
            u.delete()
            self.stdout.write(f"Cleaned placeholder user: {u.username}")

    def create_realistic_demo_users(self):
        """Seed realistic Nepal-based demo accounts."""
        for u_data in REALISTIC_DEMO_USERS:
            user, created = User.objects.get_or_create(
                email=u_data['email'],
                defaults={
                    'username': u_data['username'],
                    'first_name': u_data['first_name'],
                    'last_name': u_data['last_name'],
                }
            )
            if created:
                user.set_password('TrekNepal@2026')
                user.save()

            profile, _ = Profile.objects.get_or_create(user=user)
            profile.phone_number = u_data['phone_number']
            profile.city = u_data['city']
            profile.address = u_data['address']
            profile.email_verified = True
            profile.save()

    def create_delivery_partners(self):
        """Create or update 5 delivery partners."""
        created_count = 0
        for partner_data in DELIVERY_PARTNERS_DATA:
            partner, created = DeliveryPartner.objects.get_or_create(
                phone_number=partner_data['phone_number'],
                defaults=partner_data
            )
            if created:
                created_count += 1
                self.stdout.write(f"✓ Created delivery partner: {partner.name} ({partner.current_location})")
            else:
                # Update location and email
                partner.name = partner_data['name']
                partner.email = partner_data['email']
                partner.vehicle_number = partner_data['vehicle_number']
                partner.current_location = partner_data['current_location']
                partner.save()

        self.stdout.write(self.style.SUCCESS(f'Delivery partners verified: 5'))

    def create_sample_orders(self, user):
        """Create or reassign 10 sample orders for Aarya Dhungana without duplicating."""
        partners = list(DeliveryPartner.objects.all())
        created_count = 0
        skipped_count = 0

        for index, sample in enumerate(SAMPLE_ORDERS):
            seed_key = sample['seed_key']
            order_status = sample['order_status']
            payment_status = sample['payment_status']
            needs_txn = payment_status in ('paid', 'cod_pending')

            existing = Order.objects.filter(landmark=seed_key).first()

            if not existing:
                # Also check matching destination order
                existing = Order.objects.filter(destination=sample['destination'], customer=user).first()

            start_date = timezone.now().date() + timedelta(days=index - 4)
            rental_days = sample['rental_days']
            end_date = start_date + timedelta(days=rental_days)
            gear_id = sample['gear_id']

            gear, _ = Gear.objects.update_or_create(
                gear_id=gear_id,
                defaults={
                    'name': f"{sample['destination']} Expedition Kit",
                    'category': 'Adventure Kit',
                    'brand': 'PeakKit',
                    'daily_rental_price': sample['daily_rental_price'],
                }
            )

            if existing:
                skipped_count += 1
                # Ensure fields are updated to realistic production values
                existing.customer = user
                existing.customer_email = user.email
                existing.customer_phone = '9860467948'
                existing.destination = sample['destination']
                existing.address = sample['address']
                existing.landmark = seed_key
                existing.payment_method = sample['payment_method']
                existing.payment_status = payment_status
                existing.order_status = order_status
                existing.reservation_status = sample['reservation_status']
                existing.rental_start_date = start_date
                existing.rental_end_date = end_date
                existing.rental_days = rental_days
                existing.daily_rental_price = sample['daily_rental_price']
                existing.subtotal = sample['subtotal']
                existing.return_date = timezone.datetime.combine(
                    end_date,
                    timezone.datetime.min.time(),
                    tzinfo=timezone.get_current_timezone()
                )
                existing.save()

                RentalReservation.objects.update_or_create(
                    gear=gear,
                    order=existing,
                    defaults={
                        'rental_start_date': start_date,
                        'rental_end_date': end_date,
                        'reservation_status': sample['reservation_status'] if sample['reservation_status'] in ('Reserved', 'Active', 'Returned', 'Cancelled') else 'Reserved',
                    }
                )

                Notification.objects.filter(related_order_id=existing.order_id).update(user=user)
                OrderStatusEngine.on_order_created(existing, send_external=False)
                self.stdout.write(f"↷ Verified existing order {existing.order_id} ({sample['destination']}) - {rental_days} days")
                continue

            defaults = {
                'customer_phone': '9860467948',
                'customer_email': user.email,
                'destination': sample['destination'],
                'address': sample['address'],
                'payment_method': sample['payment_method'],
                'payment_status': payment_status,
                'order_status': order_status,
                'reservation_status': sample['reservation_status'],
                'rental_start_date': start_date,
                'rental_end_date': end_date,
                'rental_days': rental_days,
                'daily_rental_price': sample['daily_rental_price'],
                'subtotal': sample['subtotal'],
                'delivery_charge': Decimal('0') if order_status == 'cancelled' else Decimal('500.00'),
                'security_deposit': Decimal('0') if order_status == 'cancelled' else Decimal('1000.00'),
                'estimated_delivery': timezone.now() + timedelta(hours=8 + index),
                'return_date': timezone.datetime.combine(
                    end_date,
                    timezone.datetime.min.time(),
                    tzinfo=timezone.get_current_timezone()
                ),
                'delivery_partner': partners[index % len(partners)] if partners and order_status != 'pending' else None,
            }

            if needs_txn:
                defaults['transaction_id'] = Order.generate_transaction_id()

            order, created = Order.objects.get_or_create(
                customer=user,
                landmark=seed_key,
                defaults=defaults,
            )

            RentalReservation.objects.update_or_create(
                gear=gear,
                order=order,
                defaults={
                    'rental_start_date': start_date,
                    'rental_end_date': end_date,
                    'reservation_status': sample['reservation_status'] if sample['reservation_status'] in ('Reserved', 'Active', 'Returned', 'Cancelled') else 'Reserved',
                }
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
            self.stdout.write(f"✓ Created order {order.order_id} ({order.destination}) - {rental_days} days - Status: {status_display}")

        return created_count, skipped_count

