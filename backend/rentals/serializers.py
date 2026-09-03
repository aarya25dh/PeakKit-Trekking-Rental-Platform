from rest_framework import serializers
from .models import Order, DeliveryPartner, TrackingEvent


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
            'payment_status', 'total_amount', 'created_at', 'delivery_partner_name'
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
            'security_deposit', 'total_amount', 'order_status', 'return_date',
            'return_completed', 'return_completed_at', 'created_at', 'updated_at',
            'tracking_events'
        )
        read_only_fields = (
            'id', 'order_id', 'created_at', 'updated_at', 'total_amount',
            'tracking_events'
        )

    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}".strip() or obj.customer.email


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new orders."""
    delivery_partner_id = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = Order
        fields = (
            'customer_phone', 'customer_email', 'destination', 'address',
            'landmark', 'payment_method', 'transaction_id', 'subtotal',
            'delivery_charge', 'security_deposit', 'estimated_delivery',
            'return_date', 'delivery_partner_id'
        )

    def create(self, validated_data):
        from rentals.status_engine import OrderStatusEngine

        request = self.context.get('request')
        validated_data['customer'] = request.user

        partner_id = validated_data.pop('delivery_partner_id', None)
        if partner_id:
            validated_data['delivery_partner_id'] = partner_id

        payment_status = validated_data.get('payment_status', 'pending')
        payment_method = validated_data.get('payment_method', 'card')
        if payment_method == 'cod':
            payment_status = validated_data.get('payment_status') or 'cod_pending'
            validated_data['payment_status'] = payment_status

        if payment_status in ('paid', 'cod_pending') and not validated_data.get('transaction_id'):
            validated_data['transaction_id'] = Order.generate_transaction_id()

        order = Order.objects.create(**validated_data)
        OrderStatusEngine.on_order_created(order, send_external=True)
        return order


class OrderStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating order status."""
    order_status = serializers.ChoiceField(
        choices=Order.ORDER_STATUS_CHOICES
    )
    payment_status = serializers.ChoiceField(
        choices=Order.PAYMENT_STATUS_CHOICES,
        required=False
    )
    delivery_partner_id = serializers.IntegerField(required=False, allow_null=True)
    tracking_title = serializers.CharField(max_length=255, required=False)
    tracking_description = serializers.CharField(required=False, allow_blank=True)
    tracking_icon = serializers.CharField(max_length=20, required=False)

    def validate_delivery_partner_id(self, value):
        if value is not None and not DeliveryPartner.objects.filter(id=value).exists():
            raise serializers.ValidationError("Delivery partner not found.")
        return value

    def update(self, instance, validated_data):
        from rentals.status_engine import OrderStatusEngine

        new_status = validated_data.get('order_status', instance.order_status)
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
