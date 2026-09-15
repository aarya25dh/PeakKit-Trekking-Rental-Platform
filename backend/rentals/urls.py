from django.urls import path
from .views import (
    OrderListView, OrderDetailView, OrderCreateView,
    OrderStatusUpdateView, OrderTrackingView,
    CartItemView, GearAvailabilityView, OrderReturnView
)

app_name = 'rentals'

urlpatterns = [
    path('orders/', OrderListView.as_view(), name='order-list'),
    path('orders/create/', OrderCreateView.as_view(), name='order-create'),
    path('orders/<str:order_id>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<str:order_id>/status/', OrderStatusUpdateView.as_view(), name='order-status'),
    path('orders/<str:order_id>/tracking/', OrderTrackingView.as_view(), name='order-tracking'),
    path('orders/<str:order_id>/return/', OrderReturnView.as_view(), name='order-return'),
    path('cart/<str:item_id>/', CartItemView.as_view(), name='cart-item'),
    path('gear/<str:gear_id>/availability/', GearAvailabilityView.as_view(), name='gear-availability'),
]
