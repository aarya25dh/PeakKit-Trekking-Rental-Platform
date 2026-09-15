from django.urls import path
from .views import (
    OrderListView, OrderDetailView, OrderCreateView,
    OrderStatusUpdateView, OrderTrackingView,
    CartItemView, GearAvailabilityView, OrderReturnView,
    GearInspectionView,
    AnalyticsDashboardView, AnalyticsMonthlyRevenueView,
    AnalyticsActiveRentalsView, AnalyticsInventoryUtilizationView,
    AnalyticsTopRentedGearView, AnalyticsPendingReturnsView,
    ExportOrdersCsvView, ExportRentalsCsvView,
    ExportCustomersCsvView, ExportInventoryCsvView,
)

app_name = 'rentals'

urlpatterns = [
    # Orders
    path('orders/', OrderListView.as_view(), name='order-list'),
    path('orders/create/', OrderCreateView.as_view(), name='order-create'),
    path('orders/<str:order_id>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<str:order_id>/status/', OrderStatusUpdateView.as_view(), name='order-status'),
    path('orders/<str:order_id>/tracking/', OrderTrackingView.as_view(), name='order-tracking'),
    path('orders/<str:order_id>/return/', OrderReturnView.as_view(), name='order-return'),
    path('orders/<str:order_id>/inspect/', GearInspectionView.as_view(), name='gear-inspect'),

    # Cart & Gear Availability
    path('cart/<str:item_id>/', CartItemView.as_view(), name='cart-item'),
    path('gear/<str:gear_id>/availability/', GearAvailabilityView.as_view(), name='gear-availability'),
    path('rentals/availability/<str:gear_id>/', GearAvailabilityView.as_view(), name='rentals-availability-alias'),

    # Admin Analytics
    path('admin/analytics/dashboard/', AnalyticsDashboardView.as_view(), name='analytics-dashboard'),
    path('admin/analytics/revenue/monthly/', AnalyticsMonthlyRevenueView.as_view(), name='analytics-revenue-monthly'),
    path('admin/analytics/rentals/active/', AnalyticsActiveRentalsView.as_view(), name='analytics-rentals-active'),
    path('admin/analytics/inventory/utilization/', AnalyticsInventoryUtilizationView.as_view(), name='analytics-inventory-utilization'),
    path('admin/analytics/gear/top-rented/', AnalyticsTopRentedGearView.as_view(), name='analytics-gear-top-rented'),
    path('admin/analytics/returns/pending/', AnalyticsPendingReturnsView.as_view(), name='analytics-returns-pending'),

    # Admin CSV Exports
    path('admin/export/orders/', ExportOrdersCsvView.as_view(), name='export-orders-csv'),
    path('admin/export/rentals/', ExportRentalsCsvView.as_view(), name='export-rentals-csv'),
    path('admin/export/customers/', ExportCustomersCsvView.as_view(), name='export-customers-csv'),
    path('admin/export/inventory/', ExportInventoryCsvView.as_view(), name='export-inventory-csv'),
]
