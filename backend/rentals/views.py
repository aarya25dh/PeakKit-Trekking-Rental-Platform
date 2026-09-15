from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta

from .models import Order, TrackingEvent, DeliveryPartner, Gear, RentalReservation, CartItem
from .serializers import (
    OrderListSerializer, OrderDetailSerializer,
    OrderCreateSerializer, OrderStatusUpdateSerializer, CartItemSerializer
)
from .services import send_order_confirmation_whatsapp
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
    Get detailed information about a specific order by string order_id (e.g. PK-2026-000015).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        order = (
            Order.objects.filter(customer=request.user, order_id__iexact=order_id).first()
            or get_object_or_404(Order, order_id=order_id, customer=request.user)
        )
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
        import logging
        logger = logging.getLogger(__name__)

        serializer = OrderCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            order = serializer.save()

            # Immediately send WhatsApp confirmation to customer.
            # Failure must NEVER break order creation.
            try:
                send_order_confirmation_whatsapp(order, request=request)
            except Exception as exc:
                logger.error(
                    "WhatsApp confirmation failed for order %s: %s",
                    order.order_id, exc
                )
            
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
        # Allow staff to update any order, or customer to update their own order
        if request.user.is_staff:
            order = (
                Order.objects.filter(order_id__iexact=order_id).first()
                or get_object_or_404(Order, order_id=order_id)
            )
        else:
            order = (
                Order.objects.filter(customer=request.user, order_id__iexact=order_id).first()
                or get_object_or_404(Order, order_id=order_id, customer=request.user)
            )

        # Normalize request data
        data = request.data
        if hasattr(data, 'dict'):
            data = data.dict()
        elif isinstance(data, dict):
            data = data.copy()
        else:
            data = {}

        # If data is empty but raw body exists, attempt JSON parsing
        if not data and request.body:
            try:
                import json
                parsed_body = json.loads(request.body.decode('utf-8'))
                if isinstance(parsed_body, dict):
                    data = parsed_body
            except Exception:
                pass

        # If curl sent JSON as a single form key without Content-Type: application/json
        if len(data) == 1:
            first_key = next(iter(data.keys()))
            if isinstance(first_key, str) and first_key.strip().startswith('{') and first_key.strip().endswith('}'):
                try:
                    import json
                    parsed = json.loads(first_key)
                    if isinstance(parsed, dict):
                        data = parsed
                except Exception:
                    pass

        serializer = OrderStatusUpdateSerializer(
            order,
            data=data,
            partial=False
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
        order = (
            Order.objects.filter(customer=request.user, order_id__iexact=order_id).first()
            or get_object_or_404(Order, order_id=order_id, customer=request.user)
        )
        events = order.tracking_events.all()
        
        serializer = OrderDetailSerializer(order)
        
        return Response({
            'message': 'Tracking information retrieved.',
            'order_id': order.order_id,
            'status': order.order_status,
            'estimated_delivery': order.estimated_delivery,
            'tracking_events': serializer.data.get('tracking_events', [])
        }, status=status.HTTP_200_OK)


class CartItemView(APIView):
    """
    PATCH /api/cart/<item_id>/
    Recalculate dynamic rental duration, subtotal, and total amount for a cart item.
    """
    permission_classes = [AllowAny]

    def patch(self, request, item_id):
        data = request.data
        start_str = data.get('rental_start_date')
        end_str = data.get('rental_end_date')
        if not start_str or not end_str:
            return Response({
                'message': 'Both rental_start_date and rental_end_date are required.',
                'errors': {
                    'rental_start_date': ['This field is required.'],
                    'rental_end_date': ['This field is required.']
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        from datetime import datetime
        try:
            start_date = datetime.strptime(str(start_str)[:10], '%Y-%m-%d').date()
            end_date = datetime.strptime(str(end_str)[:10], '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'message': 'Invalid date format. Use YYYY-MM-DD.',
                'errors': {'rental_start_date': ['Format must be YYYY-MM-DD.']}
            }, status=status.HTTP_400_BAD_REQUEST)

        if end_date <= start_date:
            return Response({
                'message': 'Rental end date must be after rental start date.',
                'errors': {'rental_end_date': ['End date must be after start date.']}
            }, status=status.HTTP_400_BAD_REQUEST)

        rental_days = (end_date - start_date).days
        if rental_days < 1 or rental_days > 30:
            return Response({
                'message': 'Rental duration must be between 1 and 30 days.',
                'errors': {'rental_days': ['Rental duration must be between 1 and 30 days.']}
            }, status=status.HTTP_400_BAD_REQUEST)

        from decimal import Decimal
        daily_price = Decimal(str(data.get('daily_rental_price') or data.get('rentalPrice') or '500.00'))
        quantity = int(data.get('quantity') or 1)
        subtotal = round(daily_price * Decimal(str(rental_days)) * Decimal(str(quantity)), 2)
        delivery_charge = Decimal(str(data.get('delivery_charge') or '0.00'))
        security_deposit = Decimal(str(data.get('security_deposit') or round(subtotal * Decimal('0.6'), 2)))
        total_amount = subtotal + delivery_charge + security_deposit

        if request.user and request.user.is_authenticated:
            CartItem.objects.update_or_create(
                user=request.user,
                item_id=str(item_id),
                defaults={
                    'name': data.get('name', f'Gear Item {item_id}'),
                    'rental_start_date': start_date,
                    'rental_end_date': end_date,
                    'rental_days': rental_days,
                    'daily_rental_price': daily_price,
                    'quantity': quantity,
                    'subtotal': subtotal,
                    'delivery_charge': delivery_charge,
                    'security_deposit': security_deposit,
                    'total_amount': total_amount,
                }
            )

        return Response({
            'message': 'Cart item recalculated successfully.',
            'item_id': str(item_id),
            'rental_start_date': start_date.strftime('%Y-%m-%d'),
            'rental_end_date': end_date.strftime('%Y-%m-%d'),
            'rental_days': rental_days,
            'daily_rental_price': str(daily_price),
            'quantity': quantity,
            'subtotal': str(subtotal),
            'delivery_charge': str(delivery_charge),
            'security_deposit': str(security_deposit),
            'total_amount': str(total_amount),
        }, status=status.HTTP_200_OK)


class GearAvailabilityView(APIView):
    """
    GET /api/gear/<gear_id>/availability/
    Return booked ranges and next available date.
    """
    permission_classes = [AllowAny]

    def get(self, request, gear_id):
        from decimal import Decimal
        gear = Gear.objects.filter(gear_id__iexact=gear_id).first()
        if not gear:
            gear, _ = Gear.objects.get_or_create(
                gear_id=gear_id,
                defaults={
                    'name': gear_id.replace('-', ' ').title(),
                    'daily_rental_price': Decimal('500.00')
                }
            )

        reservations = RentalReservation.objects.filter(
            gear=gear,
            reservation_status__in=['Reserved', 'Active']
        ).order_by('rental_start_date')

        booked_ranges = [
            {
                'start': r.rental_start_date.strftime('%Y-%m-%d'),
                'end': r.rental_end_date.strftime('%Y-%m-%d')
            }
            for r in reservations
        ]

        # Calculate next available date starting from today
        today = timezone.now().date()
        next_available = today
        for r in reservations:
            if r.rental_start_date <= next_available <= r.rental_end_date:
                next_available = r.rental_end_date + timedelta(days=1)

        return Response({
            'gear_id': gear.gear_id,
            'gear_name': gear.name,
            'booked_ranges': booked_ranges,
            'next_available_date': next_available.strftime('%Y-%m-%d')
        }, status=status.HTTP_200_OK)


class OrderReturnView(APIView):
    """
    PATCH /api/orders/<order_id>/return/
    Process gear return, update status, release rider, and emit events.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, order_id):
        if request.user.is_staff:
            order = (
                Order.objects.filter(order_id__iexact=order_id).first()
                or get_object_or_404(Order, order_id=order_id)
            )
        else:
            order = (
                Order.objects.filter(customer=request.user, order_id__iexact=order_id).first()
                or get_object_or_404(Order, order_id=order_id, customer=request.user)
            )

        condition = str(request.data.get('condition', 'good')).strip().lower()
        valid_conditions = ['excellent', 'good', 'minor_damage', 'major_damage', 'lost']
        if condition not in valid_conditions:
            return Response({
                'message': f"Invalid condition. Choices are: {', '.join(valid_conditions)}",
                'errors': {'condition': [f"Must be one of: {', '.join(valid_conditions)}"]}
            }, status=status.HTTP_400_BAD_REQUEST)

        # Update order state
        order.reservation_status = 'Returned'
        order.order_status = 'delivered'
        order.return_completed = True
        order.return_completed_at = timezone.now()
        order.save()

        # Update associated reservations
        order.reservations.update(reservation_status='Returned')

        # Release delivery partner
        if order.delivery_partner:
            from rentals.status_engine import OrderStatusEngine
            OrderStatusEngine.release_delivery_partner(order, persist=True)

        # Create tracking event "Return Completed"
        TrackingEvent.objects.create(
            order=order,
            title='Return Completed',
            description=f'Gear return completed in {condition.replace("_", " ")} condition. Deposit refund initiated.',
            icon='return',
            completed=True
        )

        # Create notification "Deposit Refund Processing"
        from users.models import Notification
        Notification.create_notification(
            user=order.customer,
            notification_type='reservation',
            title='Deposit Refund Processing',
            message=f'Return completed for order {order.order_id}. Deposit refund is being processed.',
            related_order_id=order.order_id
        )

        response_serializer = OrderDetailSerializer(order)
        return Response({
            'message': 'Return processed successfully.',
            'condition': condition,
            'order': response_serializer.data
        }, status=status.HTTP_200_OK)
