from django.contrib import admin
from .models import Order, TrackingEvent, DeliveryPartner, Gear, RentalReservation, CartItem


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
    inlines = [TrackingEventInline, RentalReservationInline]
    
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
    list_display = ('gear_id', 'name', 'category', 'brand', 'daily_rental_price', 'created_at')
    list_filter = ('category', 'brand')
    search_fields = ('gear_id', 'name', 'category', 'brand')


@admin.register(RentalReservation)
class RentalReservationAdmin(admin.ModelAdmin):
    list_display = ('gear', 'order', 'rental_start_date', 'rental_end_date', 'reservation_status')
    list_filter = ('reservation_status', 'rental_start_date', 'rental_end_date')
    search_fields = (
        'order__destination', 'order__customer__email', 'order__customer__first_name',
        'order__customer__last_name', 'gear__name', 'gear__gear_id'
    )
    ordering = ('rental_start_date', 'rental_end_date')


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


