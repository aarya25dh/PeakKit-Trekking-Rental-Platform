from django.urls import path
from .views import (
    OrderListView, OrderDetailView, OrderCreateView,
    OrderStatusUpdateView, OrderTrackingView
)

app_name = 'rentals'

urlpatterns = [
    path('orders/', OrderListView.as_view(), name='order-list'),
    path('orders/create/', OrderCreateView.as_view(), name='order-create'),
    path('orders/<str:order_id>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<str:order_id>/status/', OrderStatusUpdateView.as_view(), name='order-status'),
    path('orders/<str:order_id>/tracking/', OrderTrackingView.as_view(), name='order-tracking'),
]
