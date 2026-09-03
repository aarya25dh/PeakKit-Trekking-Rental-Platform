from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta

from .models import Order, TrackingEvent, DeliveryPartner
from .serializers import (
    OrderListSerializer, OrderDetailSerializer,
    OrderCreateSerializer, OrderStatusUpdateSerializer
)
from users.permissions import IsAuthenticatedUser


class OrderListView(APIView):
    """
    GET /api/orders/
    List all orders for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(customer=request.user)
        serializer = OrderListSerializer(orders, many=True)
        return Response({
            'message': 'Orders retrieved successfully.',
            'count': orders.count(),
            'orders': serializer.data
        }, status=status.HTTP_200_OK)


class OrderDetailView(APIView):
    """
    GET /api/orders/<order_id>/
    Get detailed information about a specific order.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        order = get_object_or_404(Order, order_id=order_id, customer=request.user)
        serializer = OrderDetailSerializer(order)
        return Response({
            'message': 'Order retrieved successfully.',
            'order': serializer.data
        }, status=status.HTTP_200_OK)


class OrderCreateView(APIView):
    """
    POST /api/orders/create/
    Create a new order/reservation.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OrderCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            order = serializer.save()
            
            # Return the created order
            response_serializer = OrderDetailSerializer(order)
            
            return Response({
                'message': 'Order created successfully.',
                'order': response_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'message': 'Order creation failed.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class OrderStatusUpdateView(APIView):
    """
    PATCH /api/orders/<order_id>/status/
    Update order status and automatically create tracking event.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, order_id):
        order = get_object_or_404(Order, order_id=order_id, customer=request.user)
        
        serializer = OrderStatusUpdateSerializer(
            order,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            updated_order = serializer.save()
            response_serializer = OrderDetailSerializer(updated_order)
            
            return Response({
                'message': 'Order status updated successfully.',
                'order': response_serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'message': 'Status update failed.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class OrderTrackingView(APIView):
    """
    GET /api/orders/<order_id>/tracking/
    Get tracking timeline for an order.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        order = get_object_or_404(Order, order_id=order_id, customer=request.user)
        events = order.tracking_events.all()
        
        serializer = OrderDetailSerializer(order)
        
        return Response({
            'message': 'Tracking information retrieved.',
            'order_id': order.order_id,
            'status': order.order_status,
            'estimated_delivery': order.estimated_delivery,
            'tracking_events': serializer.data.get('tracking_events', [])
        }, status=status.HTTP_200_OK)
