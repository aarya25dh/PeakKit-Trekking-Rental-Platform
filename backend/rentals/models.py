from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid


class DeliveryPartner(models.Model):
    """
    Delivery partner model for managing riders.
    """
    VEHICLE_CHOICES = [
        ('bike', 'Motorcycle'),
        ('scooter', 'Scooter'),
        ('car', 'Car'),
        ('van', 'Van'),
    ]

    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15, unique=True)
    whatsapp_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_CHOICES, default='bike')
    vehicle_number = models.CharField(max_length=20, unique=True)
    available = models.BooleanField(default=True)
    current_location = models.CharField(max_length=255, blank=True, default='PeakKit Warehouse')
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=5.0)
    total_deliveries = models.IntegerField(default=0)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Delivery Partner"
        verbose_name_plural = "Delivery Partners"
        ordering = ['-available', '-rating']

    def __str__(self):
        return f"{self.name} - {self.vehicle_number}"


class Order(models.Model):
    """
    Order model for tracking rental reservations and orders.
    """
    ORDER_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('packed', 'Packed'),
        ('shipped', 'Shipped'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('cod_pending', 'COD Pending'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('card', 'Credit/Debit Card'),
        ('paypal', 'PayPal'),
        ('cod', 'Cash on Delivery'),
        ('bank_transfer', 'Bank Transfer'),
        ('esewa', 'eSewa'),
        ('khalti', 'Khalti'),
    ]

    # Unique order identifier
    order_id = models.CharField(max_length=20, unique=True, db_index=True)

    # Customer information
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    customer_phone = models.CharField(max_length=15)
    customer_email = models.EmailField()

    # Delivery information
    delivery_partner = models.ForeignKey(
        DeliveryPartner,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deliveries'
    )
    destination = models.CharField(max_length=255)
    address = models.TextField()
    landmark = models.CharField(max_length=255, blank=True)
    estimated_delivery = models.DateTimeField(null=True, blank=True)

    # Payment information
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='card')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=255, blank=True, null=True, unique=True)

    RESERVATION_STATUS_CHOICES = [
        ('Upcoming', 'Upcoming'),
        ('Active', 'Active'),
        ('Returning', 'Returning'),
        ('Returned', 'Returned'),
        ('Cancelled', 'Cancelled'),
    ]

    # Order amounts
    daily_rental_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    rental_days = models.IntegerField(default=7)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Order status and reservation status
    order_status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='pending')
    reservation_status = models.CharField(
        max_length=20,
        choices=RESERVATION_STATUS_CHOICES,
        default='Upcoming'
    )

    # Rental period dates
    rental_start_date = models.DateField(null=True, blank=True)
    rental_end_date = models.DateField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Return information (for rentals)
    return_date = models.DateTimeField(null=True, blank=True)
    return_completed = models.BooleanField(default=False)
    return_completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Order"
        verbose_name_plural = "Orders"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_id']),
            models.Index(fields=['customer']),
            models.Index(fields=['order_status']),
            models.Index(fields=['payment_status']),
            models.Index(fields=['reservation_status']),
            models.Index(fields=['rental_start_date']),
            models.Index(fields=['rental_end_date']),
        ]

    def __str__(self):
        return f"{self.order_id} - {self.customer.email}"

    @classmethod
    def generate_transaction_id(cls):
        """Generate a unique transaction ID: TXN-YYYYMMDD-000001."""
        date_str = timezone.now().strftime('%Y%m%d')
        prefix = f'TXN-{date_str}-'
        last = (
            cls.objects.filter(transaction_id__startswith=prefix)
            .order_by('-transaction_id')
            .first()
        )
        if last and last.transaction_id:
            try:
                next_num = int(last.transaction_id.rsplit('-', 1)[-1]) + 1
            except (TypeError, ValueError):
                next_num = 1
        else:
            next_num = 1
        return f'{prefix}{next_num:06d}'

    def save(self, *args, **kwargs):
        """Generate order_id and calculate pricing / dates dynamically."""
        if not self.order_id:
            # Format: PK-2026-000001
            year = timezone.now().year
            last_order = Order.objects.filter(
                order_id__startswith=f'PK-{year}-'
            ).order_by('-id').first()
            
            if last_order:
                # Extract the number from the last order_id
                last_num = int(last_order.order_id.split('-')[-1])
                next_num = last_num + 1
            else:
                next_num = 1
            
            self.order_id = f'PK-{year}-{next_num:06d}'

        # Ensure rental_start_date and rental_end_date are date objects if strings were passed
        from datetime import datetime
        if isinstance(self.rental_start_date, str):
            self.rental_start_date = datetime.strptime(self.rental_start_date[:10], '%Y-%m-%d').date()
        if isinstance(self.rental_end_date, str):
            self.rental_end_date = datetime.strptime(self.rental_end_date[:10], '%Y-%m-%d').date()

        # Dynamic rental days calculation
        if self.rental_start_date and self.rental_end_date:
            delta_days = (self.rental_end_date - self.rental_start_date).days
            if delta_days > 0:
                self.rental_days = delta_days

            # Auto-sync return_date with rental_end_date
            if not self.return_date or (hasattr(self.return_date, 'date') and self.return_date.date() != self.rental_end_date):
                self.return_date = timezone.datetime.combine(
                    self.rental_end_date,
                    timezone.datetime.min.time(),
                    tzinfo=timezone.get_current_timezone()
                )

        from decimal import Decimal
        # Recalculate subtotal from daily price or vice versa
        if self.daily_rental_price and Decimal(str(self.daily_rental_price)) > 0 and self.rental_days:
            self.subtotal = Decimal(str(self.daily_rental_price)) * Decimal(str(self.rental_days))
        elif self.subtotal and self.rental_days:
            self.daily_rental_price = round(Decimal(str(self.subtotal)) / Decimal(str(self.rental_days)), 2)
        
        # Auto-calculate total_amount safely with Decimal
        if self.subtotal is not None and self.delivery_charge is not None:
            sub = Decimal(str(self.subtotal))
            deliv = Decimal(str(self.delivery_charge))
            sec = Decimal(str(self.security_deposit or '0.00'))
            self.total_amount = sub + deliv + sec
        
        super().save(*args, **kwargs)


class TrackingEvent(models.Model):
    """
    Tracking event for order status updates.
    Each order can have multiple tracking events forming a timeline.
    """
    TRACKING_ICONS = [
        ('reservation', 'Reservation'),
        ('payment', 'Payment'),
        ('sanitize', 'Sanitize'),
        ('pack', 'Pack'),
        ('rider', 'Rider'),
        ('delivery', 'Delivery'),
        ('delivered', 'Delivered'),
        ('return', 'Return'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='tracking_events')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=20, choices=TRACKING_ICONS, default='reservation')
    timestamp = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Tracking Event"
        verbose_name_plural = "Tracking Events"
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.order.order_id} - {self.title}"


class Gear(models.Model):
    """
    Gear inventory item model representing rent-able equipment and adventure kits.
    """
    SIZE_CHOICES = [
        ('XS', 'XS'),
        ('S', 'S'),
        ('M', 'M'),
        ('L', 'L'),
        ('XL', 'XL'),
        ('One Size', 'One Size'),
    ]

    CONDITION_CHOICES = [
        ('new', 'New'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
    ]

    gear_id = models.CharField(max_length=100, unique=True, db_index=True)
    sku = models.CharField(max_length=50, unique=True, db_index=True, blank=True, null=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True)
    brand = models.CharField(max_length=100, blank=True)
    size = models.CharField(max_length=20, choices=SIZE_CHOICES, default='One Size')
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='good')
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    daily_rental_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    image_url = models.CharField(max_length=500, blank=True, default='',
                                  help_text="Relative URL to product image, e.g. /images/products/backpack1.jpg")

    quantity_total = models.IntegerField(default=1)
    quantity_available = models.IntegerField(default=1)
    quantity_reserved = models.IntegerField(default=0)
    quantity_under_maintenance = models.IntegerField(default=0)

    sanitized_at = models.DateTimeField(null=True, blank=True)
    inspection_due = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Gear"
        verbose_name_plural = "Gear"
        ordering = ['name']

    def __str__(self):
        return f"{self.sku or self.gear_id} - {self.name}"

    @property
    def rental_price_per_day(self):
        return self.daily_rental_price

    @rental_price_per_day.setter
    def rental_price_per_day(self, value):
        self.daily_rental_price = value

    def save(self, *args, **kwargs):
        if not self.sku:
            base_sku = f"GEAR-{(self.gear_id or 'ITEM').replace('-', '').upper()[:8]}"
            candidate = base_sku
            count = 1
            while Gear.objects.filter(sku=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base_sku}-{count}"
                count += 1
            self.sku = candidate
        super().save(*args, **kwargs)


class GearReturn(models.Model):
    """
    Return and damage inspection record for rental orders.
    """
    CONDITION_BEFORE_CHOICES = [
        ('new', 'New'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
    ]

    CONDITION_AFTER_CHOICES = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('minor_damage', 'Minor Damage'),
        ('major_damage', 'Major Damage'),
        ('lost', 'Lost'),
    ]

    order = models.OneToOneField('Order', on_delete=models.CASCADE, related_name='gear_return')
    gear = models.ForeignKey(Gear, on_delete=models.SET_NULL, null=True, blank=True, related_name='returns')
    condition_before = models.CharField(max_length=20, choices=CONDITION_BEFORE_CHOICES, default='good')
    condition_after = models.CharField(max_length=20, choices=CONDITION_AFTER_CHOICES, default='good')
    damage_notes = models.TextField(blank=True)
    cleaning_required = models.BooleanField(default=False)
    deposit_held = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    damage_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    inspected_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='gear_inspections')
    inspected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Gear Return"
        verbose_name_plural = "Gear Returns"
        ordering = ['-inspected_at']

    def __str__(self):
        return f"Return for {self.order.order_id} ({self.condition_after})"

    def save(self, *args, **kwargs):
        from decimal import Decimal
        deposit = Decimal(str(self.deposit_held or '0.00'))
        fee = Decimal(str(self.damage_fee or '0.00'))
        self.refund_amount = max(Decimal('0.00'), deposit - fee)
        super().save(*args, **kwargs)


class RentalReservation(models.Model):
    """
    Calendar reservation tracking gear bookings and availability.
    """
    RESERVATION_STATUS_CHOICES = [
        ('Reserved', 'Reserved'),
        ('Active', 'Active'),
        ('Returned', 'Returned'),
        ('Cancelled', 'Cancelled'),
    ]

    gear = models.ForeignKey(Gear, on_delete=models.CASCADE, related_name='reservations')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='reservations', null=True, blank=True)
    rental_start_date = models.DateField(db_index=True)
    rental_end_date = models.DateField(db_index=True)
    reservation_status = models.CharField(
        max_length=20,
        choices=RESERVATION_STATUS_CHOICES,
        default='Reserved',
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Rental Reservation"
        verbose_name_plural = "Rental Reservations"
        ordering = ['rental_start_date', 'rental_end_date']
        indexes = [
            models.Index(fields=['gear', 'reservation_status']),
            models.Index(fields=['rental_start_date', 'rental_end_date']),
        ]

    def __str__(self):
        return f"{self.gear.gear_id} ({self.rental_start_date} -> {self.rental_end_date}) [{self.reservation_status}]"


class CartItem(models.Model):
    """
    Cart item storage for dynamic duration and price recalculation.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items', null=True, blank=True)
    item_id = models.CharField(max_length=100, db_index=True)
    name = models.CharField(max_length=255)
    gear = models.ForeignKey(Gear, on_delete=models.SET_NULL, null=True, blank=True)
    rental_start_date = models.DateField(null=True, blank=True)
    rental_end_date = models.DateField(null=True, blank=True)
    rental_days = models.IntegerField(default=7)
    daily_rental_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    quantity = models.IntegerField(default=1)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Cart Item"
        verbose_name_plural = "Cart Items"
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.item_id} - {self.name} ({self.rental_days} days)"


class AdventureKit(models.Model):
    """
    Adventure Kit bundle model composed of multiple Gear inventory items.
    """
    kit_id = models.CharField(max_length=100, unique=True, db_index=True)
    slug = models.SlugField(max_length=150, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, default="Trekking")
    destination = models.CharField(max_length=255, blank=True)
    difficulty = models.CharField(max_length=50, default="Moderate")
    duration_days = models.CharField(max_length=50, default="7-10 days")
    base_discount_percent = models.IntegerField(default=20)
    banner_image = models.CharField(max_length=500, default="/images/packages/ebc-kit.jpg")
    description = models.TextField(blank=True)
    season = models.CharField(max_length=100, default="All year")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Adventure Kit"
        verbose_name_plural = "Adventure Kits"
        ordering = ['name']

    def __str__(self):
        return f"{self.kit_id} - {self.name}"

    @property
    def total_daily_price(self):
        """Calculates bundle daily rental price with applied bundle discount."""
        from decimal import Decimal
        total_undiscounted = sum(
            (item.override_daily_price if item.override_daily_price is not None else item.gear.daily_rental_price) * item.quantity
            for item in self.items.all() if item.gear
        )
        discount_factor = Decimal(str(1 - (self.base_discount_percent / 100.0)))
        return round(total_undiscounted * discount_factor, 2)

    @property
    def undiscounted_daily_price(self):
        """Original cumulative daily price of constituent gear."""
        return sum(
            (item.override_daily_price if item.override_daily_price is not None else item.gear.daily_rental_price) * item.quantity
            for item in self.items.all() if item.gear
        )

    @property
    def quantity_available(self):
        """Dynamic availability calculated from lowest available constituent item."""
        mandatory_items = self.items.filter(is_optional=False)
        if not mandatory_items.exists():
            return 0
        counts = [
            (item.gear.quantity_available // item.quantity)
            for item in mandatory_items if item.gear and item.quantity > 0
        ]
        return min(counts) if counts else 0

    @property
    def is_available(self):
        return self.quantity_available > 0


class AdventureKitItem(models.Model):
    """
    Constituent gear item in an AdventureKit bundle.
    """
    kit = models.ForeignKey(AdventureKit, on_delete=models.CASCADE, related_name='items')
    gear = models.ForeignKey(Gear, on_delete=models.CASCADE, related_name='kit_memberships')
    quantity = models.IntegerField(default=1)
    is_optional = models.BooleanField(default=False)
    override_daily_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Adventure Kit Item"
        verbose_name_plural = "Adventure Kit Items"
        unique_together = ('kit', 'gear')

    def __str__(self):
        return f"{self.kit.name} -> {self.quantity}x {self.gear.name}"


class OrderItem(models.Model):
    """
    Individual line item inside a confirmed or pending rental Order.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_items')
    gear = models.ForeignKey(Gear, on_delete=models.SET_NULL, null=True, blank=True, related_name='order_lines')
    kit = models.ForeignKey(AdventureKit, on_delete=models.SET_NULL, null=True, blank=True, related_name='order_lines')
    item_name = models.CharField(max_length=255)
    quantity = models.IntegerField(default=1)
    daily_rental_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Order Item"
        verbose_name_plural = "Order Items"
        ordering = ['id']

    def __str__(self):
        return f"{self.order.order_id} - {self.quantity}x {self.item_name}"

    def save(self, *args, **kwargs):
        from decimal import Decimal
        days = self.order.rental_days if self.order and self.order.rental_days else 1
        self.subtotal = Decimal(str(self.daily_rental_price)) * Decimal(str(self.quantity)) * Decimal(str(days))
        super().save(*args, **kwargs)

