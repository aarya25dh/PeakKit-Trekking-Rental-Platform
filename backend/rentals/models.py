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

    # Order amounts
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Order status
    order_status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='pending')

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
        """Generate order_id if not present."""
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
        
        # Auto-calculate total_amount
        if self.subtotal and self.delivery_charge is not None:
            self.total_amount = self.subtotal + self.delivery_charge + (self.security_deposit or 0)
        
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
