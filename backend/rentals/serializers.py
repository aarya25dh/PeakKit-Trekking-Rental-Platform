from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from .models import Order, DeliveryPartner, TrackingEvent, CartItem, Gear, RentalReservation


class DeliveryPartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryPartner
        fields = (
            'id', 'name', 'phone_number', 'whatsapp_number', 'email',
            'vehicle_type', 'vehicle_number', 'available', 'current_location',
            'rating', 'total_deliveries', 'date_joined'
        )
        read_only_fields = ('id', 'date_joined', 'total_deliveries')


class TrackingEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrackingEvent
        fields = ('id', 'order', 'title', 'description', 'icon', 'timestamp', 'completed')
        read_only_fields = ('id', 'order', 'timestamp')


class OrderListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for order listings."""
    customer_name = serializers.SerializerMethodField()
    delivery_partner_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = (
            'id', 'order_id', 'customer_name', 'destination', 'order_status',
            'reservation_status', 'rental_start_date', 'rental_end_date',
            'rental_days', 'return_date', 'daily_rental_price', 'payment_status',
            'total_amount', 'created_at', 'delivery_partner_name'
        )
        read_only_fields = fields

    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}".strip() or obj.customer.email

    def get_delivery_partner_name(self, obj):
        return obj.delivery_partner.name if obj.delivery_partner else 'Not assigned'


class OrderDetailSerializer(serializers.ModelSerializer):
    """Full order serializer with related data."""
    customer_name = serializers.SerializerMethodField()
    delivery_partner = DeliveryPartnerSerializer(read_only=True)
    tracking_events = TrackingEventSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = (
            'id', 'order_id', 'customer', 'customer_name', 'customer_phone',
            'customer_email', 'destination', 'address', 'landmark',
            'delivery_partner', 'estimated_delivery', 'payment_method',
            'payment_status', 'transaction_id', 'subtotal', 'delivery_charge',
            'security_deposit', 'total_amount', 'order_status',
            'reservation_status', 'rental_start_date', 'rental_end_date',
            'rental_days', 'daily_rental_price', 'return_date',
            'return_completed', 'return_completed_at', 'created_at', 'updated_at',
            'tracking_events'
        )
        read_only_fields = (
            'id', 'order_id', 'created_at', 'updated_at', 'total_amount',
            'tracking_events'
        )

    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}".strip() or obj.customer.email


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for Cart Item with dynamic rental duration recalculation."""
    rental_start_date = serializers.DateField(required=True)
    rental_end_date = serializers.DateField(required=True)
    daily_rental_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    class Meta:
        model = CartItem
        fields = (
            'id', 'item_id', 'name', 'rental_start_date', 'rental_end_date',
            'rental_days', 'daily_rental_price', 'quantity', 'subtotal',
            'delivery_charge', 'security_deposit', 'total_amount'
        )
        read_only_fields = ('id', 'rental_days', 'subtotal', 'total_amount')

    def validate(self, attrs):
        start_date = attrs.get('rental_start_date')
        end_date = attrs.get('rental_end_date')

        if not start_date or not end_date:
            raise serializers.ValidationError({
                'rental_start_date': 'Both rental_start_date and rental_end_date are required.'
            })

        if end_date <= start_date:
            raise serializers.ValidationError({
                'rental_end_date': 'Rental end date must be after rental start date.'
            })

        days = (end_date - start_date).days
        if days < 1:
            raise serializers.ValidationError({
                'rental_days': 'Rental duration must be at least 1 day.'
            })
        if days > 30:
            raise serializers.ValidationError({
                'rental_days': 'Rental duration cannot exceed 30 days.'
            })

        attrs['rental_days'] = days
        return attrs


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new orders with real rental duration & pricing engine."""
    customer_phone = serializers.CharField(required=False, allow_blank=True)
    customer_email = serializers.EmailField(required=False, allow_blank=True)
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    rental_start_date = serializers.DateField(required=False, allow_null=True)
    rental_end_date = serializers.DateField(required=False, allow_null=True)
    daily_rental_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    gear_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    payment_method = serializers.CharField(required=False, default='card')
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=Decimal('5000.00'))
    delivery_charge = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=Decimal('500.00'))
    security_deposit = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=Decimal('1000.00'))
    delivery_partner_id = serializers.IntegerField(required=False, allow_null=True)
    
    PAYMENT_METHOD_MAP = {
        'esewa': 'esewa',
        'e-sewa': 'esewa',
        'e_sewa': 'esewa',
        'khalti': 'khalti',
        'cod': 'cod',
        'cash_on_delivery': 'cod',
        'cash on delivery': 'cod',
        'cash': 'cod',
        'card': 'card',
        'credit_card': 'card',
        'debit_card': 'card',
        'credit/debit card': 'card',
        'credit card': 'card',
        'paypal': 'paypal',
        'bank_transfer': 'bank_transfer',
        'bank': 'bank_transfer',
        'bank transfer': 'bank_transfer',
    }

    class Meta:
        model = Order
        fields = (
            'customer_phone', 'customer_email', 'phone_number', 'destination', 'address',
            'landmark', 'payment_method', 'transaction_id', 'rental_start_date',
            'rental_end_date', 'daily_rental_price', 'gear_id', 'subtotal',
            'delivery_charge', 'security_deposit', 'estimated_delivery',
            'return_date', 'delivery_partner_id'
        )

    def validate_payment_method(self, value):
        if not value:
            return 'card'
        raw = str(value).strip().lower()
        cleaned = raw.replace('-', '_').replace(' ', '_')
        if cleaned in self.PAYMENT_METHOD_MAP:
            return self.PAYMENT_METHOD_MAP[cleaned]
        if raw in self.PAYMENT_METHOD_MAP:
            return self.PAYMENT_METHOD_MAP[raw]
        return cleaned

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        # Auto-resolve customer_email from user
        if not attrs.get('customer_email'):
            if user and user.email:
                attrs['customer_email'] = user.email
            else:
                attrs['customer_email'] = 'customer@peakkit.com'

        # Auto-resolve customer_phone from phone_number or customer_phone or user.profile
        phone = attrs.pop('phone_number', None) or attrs.get('customer_phone')
        if not phone and user and hasattr(user, 'profile') and user.profile.phone_number:
            phone = user.profile.phone_number
        if not phone:
            phone = '9800000000'
        attrs['customer_phone'] = phone

        # Defaults for rental_start_date & rental_end_date if not provided (for backward compatibility)
        start_date = attrs.get('rental_start_date')
        end_date = attrs.get('rental_end_date')

        if not start_date and not end_date:
            start_date = timezone.now().date()
            end_date = start_date + timedelta(days=7)
            attrs['rental_start_date'] = start_date
            attrs['rental_end_date'] = end_date
        elif not start_date or not end_date:
            raise serializers.ValidationError({
                'rental_start_date': 'Both rental_start_date and rental_end_date must be provided.'
            })

        # Validate date sequence
        if end_date <= start_date:
            raise serializers.ValidationError({
                'rental_end_date': 'Rental end date must be after rental start date.'
            })

        rental_days = (end_date - start_date).days
        if rental_days < 1:
            raise serializers.ValidationError({
                'rental_days': 'Rental duration must be at least 1 day.'
            })
        if rental_days > 30:
            raise serializers.ValidationError({
                'rental_days': 'Rental duration cannot exceed 30 days.'
            })
        attrs['rental_days'] = rental_days

        # Dynamic pricing engine: subtotal = daily_rental_price * rental_days
        daily_price = attrs.get('daily_rental_price')
        subtotal = attrs.get('subtotal')
        if daily_price and daily_price > Decimal('0.00'):
            attrs['subtotal'] = daily_price * Decimal(str(rental_days))
        elif subtotal and subtotal > Decimal('0.00'):
            attrs['daily_rental_price'] = round(subtotal / Decimal(str(rental_days)), 2)
        else:
            default_daily = Decimal('500.00')
            attrs['daily_rental_price'] = default_daily
            attrs['subtotal'] = default_daily * Decimal(str(rental_days))

        delivery_charge = attrs.get('delivery_charge')
        if delivery_charge is None:
            delivery_charge = Decimal('500.00')
            attrs['delivery_charge'] = delivery_charge

        security_deposit = attrs.get('security_deposit')
        if security_deposit is None:
            security_deposit = round(attrs['subtotal'] * Decimal('0.6'), 2)
            attrs['security_deposit'] = security_deposit

        attrs['total_amount'] = attrs['subtotal'] + delivery_charge + security_deposit

        # Sync return_date and estimated_delivery
        if not attrs.get('estimated_delivery'):
            attrs['estimated_delivery'] = timezone.now() + timedelta(hours=24)

        attrs['return_date'] = timezone.datetime.combine(
            end_date,
            timezone.datetime.min.time(),
            tzinfo=timezone.get_current_timezone()
        )

        # Availability overlap check if gear_id is provided
        from rentals.models import Gear, RentalReservation
        gear_id = attrs.pop('gear_id', None)
        if gear_id:
            gear, _ = Gear.objects.get_or_create(
                gear_id=gear_id,
                defaults={
                    'name': attrs.get('destination') or gear_id,
                    'daily_rental_price': attrs.get('daily_rental_price', Decimal('500.00')),
                }
            )
            # Check overlap: requested dates intersect any existing reservation with status Reserved or Active
            overlapping = RentalReservation.objects.filter(
                gear=gear,
                reservation_status__in=['Reserved', 'Active'],
                rental_start_date__lte=end_date,
                rental_end_date__gte=start_date
            ).order_by('rental_end_date')

            if overlapping.exists():
                latest_conflict = overlapping.last()
                next_date = latest_conflict.rental_end_date + timedelta(days=1)
                # Ensure next_date does not fall into another reserved window
                while RentalReservation.objects.filter(
                    gear=gear,
                    reservation_status__in=['Reserved', 'Active'],
                    rental_start_date__lte=next_date,
                    rental_end_date__gte=next_date
                ).exists():
                    next_date += timedelta(days=1)

                raise serializers.ValidationError({
                    'message': 'Gear unavailable for selected dates.',
                    'next_available_date': next_date.strftime('%Y-%m-%d')
                })

            attrs['_gear'] = gear

        return attrs

    def create(self, validated_data):
        from rentals.status_engine import OrderStatusEngine
        from rentals.models import RentalReservation

        gear = validated_data.pop('_gear', None)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['customer'] = request.user

        partner_id = validated_data.pop('delivery_partner_id', None)
        if partner_id:
            validated_data['delivery_partner_id'] = partner_id

        payment_method = validated_data.get('payment_method', 'card')
        
        # For digital payments / card / esewa / khalti / paypal, mark paid + confirmed
        if payment_method == 'cod':
            payment_status = validated_data.get('payment_status') or 'cod_pending'
            order_status = validated_data.get('order_status') or 'confirmed'
        else:
            payment_status = validated_data.get('payment_status') or 'paid'
            order_status = validated_data.get('order_status') or 'confirmed'

        validated_data['payment_status'] = payment_status
        validated_data['order_status'] = order_status
        validated_data['reservation_status'] = 'Active' if order_status == 'confirmed' else 'Upcoming'

        if payment_status in ('paid', 'cod_pending') and not validated_data.get('transaction_id'):
            validated_data['transaction_id'] = Order.generate_transaction_id()

        order = Order.objects.create(**validated_data)

        # Create RentalReservation if gear was specified
        if gear:
            RentalReservation.objects.create(
                gear=gear,
                order=order,
                rental_start_date=order.rental_start_date,
                rental_end_date=order.rental_end_date,
                reservation_status='Active' if order.reservation_status == 'Active' else 'Reserved'
            )
            from django.db import transaction
            with transaction.atomic():
                g = Gear.objects.select_for_update().get(pk=gear.pk)
                if g.quantity_available > 0:
                    g.quantity_available -= 1
                    g.quantity_reserved += 1
                    g.save()

        OrderStatusEngine.on_order_created(order, send_external=True)
        return order


class GearReturnSerializer(serializers.ModelSerializer):
    """Serializer for Gear Return & Damage Inspection."""
    class Meta:
        from rentals.models import GearReturn
        model = GearReturn
        fields = (
            'id', 'order', 'gear', 'condition_before', 'condition_after',
            'damage_notes', 'cleaning_required', 'deposit_held', 'damage_fee',
            'refund_amount', 'inspected_by', 'inspected_at'
        )
        read_only_fields = ('id', 'deposit_held', 'refund_amount', 'inspected_at')


class OrderStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating order status."""
    order_status = serializers.CharField(required=True)
    status = serializers.CharField(required=False, write_only=True)
    payment_status = serializers.ChoiceField(
        choices=Order.PAYMENT_STATUS_CHOICES,
        required=False,
        allow_null=True
    )
    delivery_partner_id = serializers.IntegerField(required=False, allow_null=True)
    tracking_title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    tracking_description = serializers.CharField(required=False, allow_blank=True)
    tracking_icon = serializers.CharField(max_length=20, required=False, allow_blank=True)

    STATUS_MAP = {
        'pending': 'pending',
        'confirmed': 'confirmed',
        'packed': 'packed',
        'shipped': 'shipped',
        'out_for_delivery': 'out_for_delivery',
        'out-for-delivery': 'out_for_delivery',
        'out for delivery': 'out_for_delivery',
        'delivered': 'delivered',
        'cancelled': 'cancelled',
        'canceled': 'cancelled',
    }

    def to_internal_value(self, data):
        # Support 'status' as alias for 'order_status' if order_status missing
        if hasattr(data, 'copy'):
            mutable_data = data.copy()
        elif isinstance(data, dict):
            mutable_data = dict(data)
        else:
            mutable_data = {}

        if 'status' in mutable_data and 'order_status' not in mutable_data:
            mutable_data['order_status'] = mutable_data['status']

        return super().to_internal_value(mutable_data)

    def validate_order_status(self, value):
        if not value:
            raise serializers.ValidationError("order_status cannot be empty.")
        cleaned = str(value).strip().lower().replace('-', '_').replace(' ', '_')
        raw_cleaned = str(value).strip().lower()
        if cleaned in self.STATUS_MAP:
            return self.STATUS_MAP[cleaned]
        if raw_cleaned in self.STATUS_MAP:
            return self.STATUS_MAP[raw_cleaned]
        
        valid_choices = [c[0] for c in Order.ORDER_STATUS_CHOICES]
        raise serializers.ValidationError(
            f'"{value}" is not a valid choice. Valid choices are: {", ".join(valid_choices)}'
        )

    def validate_delivery_partner_id(self, value):
        if value is not None and not DeliveryPartner.objects.filter(id=value).exists():
            raise serializers.ValidationError("Delivery partner not found.")
        return value

    def update(self, instance, validated_data):
        from rentals.status_engine import OrderStatusEngine

        new_status = validated_data.get('order_status')
        if not new_status:
            raise serializers.ValidationError({"order_status": "This field is required."})

        payment_status = validated_data.get('payment_status')
        partner = None
        if 'delivery_partner_id' in validated_data and validated_data['delivery_partner_id']:
            partner = DeliveryPartner.objects.get(id=validated_data['delivery_partner_id'])

        OrderStatusEngine.update_order_status(
            instance,
            new_status,
            payment_status=payment_status,
            delivery_partner=partner,
            send_external=True,
        )
        instance.refresh_from_db()
        return instance

