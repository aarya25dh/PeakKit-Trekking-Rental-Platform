from django.contrib import admin
from .models import Order, TrackingEvent, DeliveryPartner


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


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'customer', 'destination', 'order_status', 'payment_status', 'total_amount', 'created_at')
    list_filter = ('order_status', 'payment_status', 'payment_method', 'created_at')
    search_fields = ('order_id', 'customer__email', 'destination')
    readonly_fields = ('order_id', 'created_at', 'updated_at', 'customer_email')
    inlines = [TrackingEventInline]
    
    fieldsets = (
        ('Order Info', {
            'fields': ('order_id', 'customer', 'created_at', 'updated_at')
        }),
        ('Customer Details', {
            'fields': ('customer_email', 'customer_phone')
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


@admin.register(TrackingEvent)
class TrackingEventAdmin(admin.ModelAdmin):
    list_display = ('order', 'title', 'icon', 'completed', 'timestamp')
    list_filter = ('icon', 'completed', 'timestamp')
    search_fields = ('order__order_id', 'title')
    readonly_fields = ('timestamp',)

