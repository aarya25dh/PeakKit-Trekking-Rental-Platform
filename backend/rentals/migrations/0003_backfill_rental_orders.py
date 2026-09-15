from datetime import timedelta
from decimal import Decimal
from django.db import migrations
from django.utils import timezone


def backfill_rental_orders(apps, schema_editor):
    Order = apps.get_model('rentals', 'Order')
    for order in Order.objects.all():
        updated = False
        if not order.rental_start_date:
            created_date = order.created_at.date() if order.created_at else timezone.now().date()
            order.rental_start_date = created_date
            order.rental_end_date = created_date + timedelta(days=7)
            order.rental_days = 7
            updated = True

        if not order.daily_rental_price or order.daily_rental_price == Decimal('0.00'):
            subtotal = order.subtotal or Decimal('0.00')
            days = order.rental_days or 7
            order.daily_rental_price = round(subtotal / Decimal(str(days)), 2)
            updated = True

        if not order.reservation_status or order.reservation_status == 'Upcoming':
            status = order.order_status or 'pending'
            if status in ('confirmed', 'packed', 'shipped', 'out_for_delivery'):
                order.reservation_status = 'Active'
            elif status == 'delivered':
                order.reservation_status = 'Returned'
            elif status == 'cancelled':
                order.reservation_status = 'Cancelled'
            else:
                order.reservation_status = 'Upcoming'
            updated = True

        if not order.return_date and order.rental_end_date:
            order.return_date = timezone.datetime.combine(
                order.rental_end_date,
                timezone.datetime.min.time(),
                tzinfo=timezone.get_current_timezone()
            )
            updated = True

        if updated:
            order.save()


def reverse_backfill(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('rentals', '0002_cartitem_gear_rentalreservation_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_rental_orders, reverse_backfill),
    ]
