from django.contrib import admin
from .models import Order, TrackingEvent, DeliveryPartner, Gear, RentalReservation, CartItem, GearReturn


@admin.register(DeliveryPartner)
class DeliveryPartnerAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone_number', 'vehicle_type', 'available', 'rating', 'total_deliveries')
    list_filter = ('available', 'vehicle_type', 'rating')
    search_fields = ('name', 'phone_number', 'vehicle_number')
    readonly_fields = ('date_joined', 'updated_at', 'total_deliveries')
    
    fieldsets = (
        ('Personal Info', {
            'fields': ('name', 'phone_number', 'whatsapp_number', 'email')
        }),
        ('Vehicle Info', {
            'fields': ('vehicle_type', 'vehicle_number', 'current_location')
        }),
        ('Status', {
            'fields': ('available', 'rating', 'total_deliveries')
        }),
        ('Timestamps', {
            'fields': ('date_joined', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class TrackingEventInline(admin.TabularInline):
    model = TrackingEvent
    extra = 1
    readonly_fields = ('timestamp',)
    fields = ('title', 'description', 'icon', 'completed', 'timestamp')


class RentalReservationInline(admin.TabularInline):
    model = RentalReservation
    extra = 0
    fields = ('gear', 'rental_start_date', 'rental_end_date', 'reservation_status')


class GearReturnInline(admin.StackedInline):
    model = GearReturn
    extra = 0
    readonly_fields = ('inspected_at', 'refund_amount')
    fields = (
        'gear', ('condition_before', 'condition_after'),
        'damage_notes', 'cleaning_required',
        ('deposit_held', 'damage_fee', 'refund_amount'),
        'inspected_by', 'inspected_at'
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'order_id', 'customer', 'destination', 'rental_start_date',
        'rental_end_date', 'rental_days', 'return_date', 'reservation_status'
    )
    list_filter = (
        'reservation_status', 'order_status', 'payment_status',
        'rental_start_date', 'rental_end_date', 'created_at'
    )
    search_fields = ('order_id', 'customer__email', 'destination')
    readonly_fields = ('order_id', 'created_at', 'updated_at', 'customer_email', 'rental_days')
    inlines = [TrackingEventInline, RentalReservationInline, GearReturnInline]
    
    fieldsets = (
        ('Order Info', {
            'fields': ('order_id', 'customer', 'created_at', 'updated_at')
        }),
        ('Customer Details', {
            'fields': ('customer_email', 'customer_phone')
        }),
        ('Rental Duration & Schedule', {
            'fields': ('rental_start_date', 'rental_end_date', 'rental_days', 'daily_rental_price', 'reservation_status')
        }),
        ('Delivery Info', {
            'fields': ('destination', 'address', 'landmark', 'delivery_partner', 'estimated_delivery')
        }),
        ('Payment', {
            'fields': ('payment_method', 'payment_status', 'transaction_id')
        }),
        ('Amounts', {
            'fields': ('subtotal', 'delivery_charge', 'security_deposit', 'total_amount')
        }),
        ('Status', {
            'fields': ('order_status',)
        }),
        ('Rental Return', {
            'fields': ('return_date', 'return_completed', 'return_completed_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Gear)
class GearAdmin(admin.ModelAdmin):
    list_display = (
        'sku', 'name', 'category', 'size', 'condition', 'daily_rental_price',
        'quantity_total', 'quantity_available', 'quantity_reserved',
        'quantity_under_maintenance', 'inspection_due'
    )
    list_filter = ('category', 'condition', 'size', 'inspection_due')
    search_fields = ('sku', 'gear_id', 'name', 'category', 'brand')
    ordering = ('quantity_available', 'inspection_due', '-created_at')
    inlines = [RentalReservationInline]

    fieldsets = (
        ('Gear Identification', {
            'fields': ('gear_id', 'sku', 'name', 'category', 'brand')
        }),
        ('Specifications & Pricing', {
            'fields': ('size', 'condition', 'purchase_price', 'daily_rental_price')
        }),
        ('Inventory Counts', {
            'fields': (
                'quantity_total', 'quantity_available',
                'quantity_reserved', 'quantity_under_maintenance'
            )
        }),
        ('Maintenance & Inspection', {
            'fields': ('sanitized_at', 'inspection_due')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')


@admin.register(RentalReservation)
class RentalReservationAdmin(admin.ModelAdmin):
    list_display = ('gear', 'order', 'rental_start_date', 'rental_end_date', 'reservation_status')
    list_filter = ('reservation_status', 'rental_start_date', 'rental_end_date')
    search_fields = (
        'order__order_id', 'order__destination', 'order__customer__email',
        'order__customer__first_name', 'order__customer__last_name',
        'gear__name', 'gear__gear_id', 'gear__sku'
    )
    date_hierarchy = 'rental_start_date'
    ordering = ('rental_start_date', 'rental_end_date')


@admin.register(GearReturn)
class GearReturnAdmin(admin.ModelAdmin):
    list_display = (
        'order', 'gear', 'condition_before', 'condition_after',
        'deposit_held', 'damage_fee', 'refund_amount',
        'cleaning_required', 'inspected_by', 'inspected_at'
    )
    list_filter = ('condition_after', 'cleaning_required', 'inspected_at')
    search_fields = ('order__order_id', 'gear__name', 'gear__sku', 'inspected_by__email')
    readonly_fields = ('inspected_at', 'refund_amount')


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('item_id', 'user', 'name', 'rental_start_date', 'rental_end_date', 'rental_days', 'subtotal', 'total_amount')
    list_filter = ('rental_start_date', 'rental_end_date')
    search_fields = ('item_id', 'name', 'user__email')


@admin.register(TrackingEvent)
class TrackingEventAdmin(admin.ModelAdmin):
    list_display = ('order', 'title', 'icon', 'completed', 'timestamp')
    list_filter = ('icon', 'completed', 'timestamp')
    search_fields = ('order__order_id', 'title')
    readonly_fields = ('timestamp',)


