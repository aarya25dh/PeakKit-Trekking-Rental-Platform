from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
import csv
from django.http import HttpResponse
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.contrib.auth.models import User

from .models import (
    Order, TrackingEvent, DeliveryPartner, Gear, RentalReservation,
    CartItem, GearReturn, AdventureKit, AdventureKitItem, OrderItem
)
from .serializers import (
    OrderListSerializer, OrderDetailSerializer,
    OrderCreateSerializer, OrderStatusUpdateSerializer, CartItemSerializer,
    GearSerializer, RentalReservationSerializer, DeliveryPartnerSerializer,
    AdventureKitSerializer, AdventureKitItemSerializer, OrderItemSerializer
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
        if request.user.is_staff:
            orders = Order.objects.all().order_by('-created_at')
        else:
            orders = Order.objects.filter(customer=request.user).order_by('-created_at')
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
            
            # Return the created order immediately
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
    Process gear return, update status, restore inventory idempotently, release rider, and emit events.
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

        was_already_returned = order.return_completed

        # Update order state
        order.reservation_status = 'Returned'
        order.order_status = 'delivered'
        order.return_completed = True
        if not order.return_completed_at:
            order.return_completed_at = timezone.now()
        order.save()

        # Update associated reservations
        order.reservations.update(reservation_status='Returned')

        # Idempotent inventory restoration
        if not was_already_returned:
            for res in order.reservations.select_related('gear'):
                if res.gear:
                    with transaction.atomic():
                        g = Gear.objects.select_for_update().get(pk=res.gear.pk)
                        if g.quantity_reserved > 0:
                            g.quantity_reserved -= 1
                        if condition in ['major_damage', 'lost']:
                            g.quantity_under_maintenance += 1
                        else:
                            g.quantity_available += 1
                        g.save()

        # Release delivery partner
        if order.delivery_partner:
            from rentals.status_engine import OrderStatusEngine
            OrderStatusEngine.release_delivery_partner(order, persist=True)

        # Create tracking event "Return Completed" only if not already completed
        if not was_already_returned:
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

        # Create or update GearReturn record
        damage_fee = Decimal(str(request.data.get('damage_fee', '0.00')))
        deposit_held = Decimal(str(order.security_deposit or '0.00'))
        gear_obj = order.reservations.first().gear if order.reservations.exists() else None
        gear_return, _ = GearReturn.objects.update_or_create(
            order=order,
            defaults={
                'gear': gear_obj,
                'condition_before': request.data.get('condition_before') or (gear_obj.condition if gear_obj else 'good'),
                'condition_after': condition,
                'damage_notes': request.data.get('damage_notes', ''),
                'cleaning_required': bool(request.data.get('cleaning_required', False)),
                'deposit_held': deposit_held,
                'damage_fee': damage_fee,
                'inspected_by': request.user if request.user.is_authenticated else None,
            }
        )

        response_serializer = OrderDetailSerializer(order)
        return Response({
            'message': 'Return processed successfully.',
            'condition': condition,
            'refund_amount': str(gear_return.refund_amount),
            'damage_fee': str(gear_return.damage_fee),
            'order': response_serializer.data
        }, status=status.HTTP_200_OK)


class GearInspectionView(APIView):
    """
    POST /api/orders/<order_id>/inspect/
    Admin/staff inspection of returned gear.
    Validates condition, damage notes, damage fee, calculates refund server-side, and updates inventory.
    """
    permission_classes = [IsAdminUser]

    def post(self, request, order_id):
        order = (
            Order.objects.filter(order_id__iexact=order_id).first()
            or get_object_or_404(Order, order_id=order_id)
        )

        condition = str(request.data.get('condition', request.data.get('condition_after', 'good'))).strip().lower()
        valid_conditions = ['excellent', 'good', 'minor_damage', 'major_damage', 'lost']
        if condition not in valid_conditions:
            return Response({
                'message': f"Invalid condition. Choices are: {', '.join(valid_conditions)}",
                'errors': {'condition': [f"Must be one of: {', '.join(valid_conditions)}"]}
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            damage_fee = Decimal(str(request.data.get('damage_fee', '0.00')))
        except Exception:
            damage_fee = Decimal('0.00')

        if damage_fee < Decimal('0.00'):
            return Response({
                'message': 'Damage fee cannot be negative.',
                'errors': {'damage_fee': ['Must be >= 0.']}
            }, status=status.HTTP_400_BAD_REQUEST)

        deposit_held = Decimal(str(order.security_deposit or '0.00'))
        was_already_returned = order.return_completed

        # Update order state
        order.reservation_status = 'Returned'
        order.order_status = 'delivered'
        order.return_completed = True
        if not order.return_completed_at:
            order.return_completed_at = timezone.now()
        order.save()

        order.reservations.update(reservation_status='Returned')

        # Concurrency-safe inventory restoration if not previously returned
        if not was_already_returned:
            for res in order.reservations.select_related('gear'):
                if res.gear:
                    with transaction.atomic():
                        g = Gear.objects.select_for_update().get(pk=res.gear.pk)
                        if g.quantity_reserved > 0:
                            g.quantity_reserved -= 1
                        if condition in ['major_damage', 'lost']:
                            g.quantity_under_maintenance += 1
                        else:
                            g.quantity_available += 1
                        g.save()

        # Release partner
        if order.delivery_partner:
            from rentals.status_engine import OrderStatusEngine
            OrderStatusEngine.release_delivery_partner(order, persist=True)

        gear_obj = order.reservations.first().gear if order.reservations.exists() else None
        gear_return, _ = GearReturn.objects.update_or_create(
            order=order,
            defaults={
                'gear': gear_obj,
                'condition_before': request.data.get('condition_before') or (gear_obj.condition if gear_obj else 'good'),
                'condition_after': condition,
                'damage_notes': request.data.get('damage_notes', ''),
                'cleaning_required': bool(request.data.get('cleaning_required', False)),
                'deposit_held': deposit_held,
                'damage_fee': damage_fee,
                'inspected_by': request.user,
            }
        )

        return Response({
            'message': 'Gear inspection completed successfully.',
            'order_id': order.order_id,
            'condition_before': gear_return.condition_before,
            'condition_after': gear_return.condition_after,
            'deposit_held': str(gear_return.deposit_held),
            'damage_fee': str(gear_return.damage_fee),
            'refund_amount': str(gear_return.refund_amount),
            'cleaning_required': gear_return.cleaning_required,
            'damage_notes': gear_return.damage_notes,
            'inspected_by': request.user.email or request.user.username,
            'inspected_at': gear_return.inspected_at.isoformat(),
        }, status=status.HTTP_200_OK)


# ==========================================
# Module 5 — Analytics APIs (Admin-Only)
# ==========================================

class AnalyticsDashboardView(APIView):
    """
    GET /api/admin/analytics/dashboard/
    Overview stats for orders, revenue, active rentals, and pending returns.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_orders = Order.objects.count()
        paid_revenue = Order.objects.filter(
            payment_status__in=['paid', 'cod_pending']
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        active_rentals = Order.objects.filter(reservation_status__in=['Active', 'Upcoming']).count()
        now = timezone.now()
        pending_returns = Order.objects.filter(
            return_completed=False,
            return_date__lt=now
        ).exclude(order_status='cancelled').count()

        total_customers = User.objects.filter(is_staff=False, is_superuser=False).exclude(
            username__in=['suman.tamang', 'prabin.lama', 'kiran.thapa', 'bikash.magar', 'anisha.gurung']
        ).count()
        total_gear = Gear.objects.count()
        completed_orders = Order.objects.filter(
            Q(order_status__in=['delivered', 'completed']) | Q(return_completed=True)
        ).count()
        processing_orders = Order.objects.filter(
            order_status__in=['pending', 'confirmed', 'packed', 'processing', 'shipped', 'out_for_delivery']
        ).count()
        cancelled_orders = Order.objects.filter(order_status='cancelled').count()

        return Response({
            'total_orders': total_orders,
            'total_revenue': str(paid_revenue),
            'active_rentals': active_rentals,
            'pending_returns': pending_returns,
            'total_customers': total_customers,
            'total_gear': total_gear,
            'completed_orders': completed_orders,
            'processing_orders': processing_orders,
            'cancelled_orders': cancelled_orders,
        }, status=status.HTTP_200_OK)


class AnalyticsMonthlyRevenueView(APIView):
    """
    GET /api/admin/analytics/revenue/monthly/
    Monthly revenue aggregation for the last 12 months.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        start_date = (now - timedelta(days=365)).replace(day=1)
        monthly_data = (
            Order.objects.filter(
                payment_status__in=['paid', 'cod_pending'],
                created_at__gte=start_date
            )
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(revenue=Sum('total_amount'), order_count=Count('id'))
            .order_by('month')
        )

        results = [
            {
                'month': entry['month'].strftime('%Y-%m'),
                'revenue': str(entry['revenue'] or '0.00'),
                'order_count': entry['order_count']
            }
            for entry in monthly_data
        ]
        return Response({
            'count': len(results),
            'monthly_revenue': results
        }, status=status.HTTP_200_OK)


class AnalyticsActiveRentalsView(APIView):
    """
    GET /api/admin/analytics/rentals/active/
    List active / upcoming rental orders.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        orders = Order.objects.filter(reservation_status__in=['Active', 'Upcoming']).order_by('-created_at')
        serializer = OrderListSerializer(orders, many=True)
        return Response({
            'count': orders.count(),
            'active_rentals': serializer.data
        }, status=status.HTTP_200_OK)


class AnalyticsInventoryUtilizationView(APIView):
    """
    GET /api/admin/analytics/inventory/utilization/
    Real inventory utilization data per gear item.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        gears = Gear.objects.all().order_by('name')
        data = []
        for g in gears:
            tot = g.quantity_total
            res = g.quantity_reserved
            utilization = round((res / tot * 100), 2) if tot > 0 else 0.0
            data.append({
                'gear_id': g.gear_id,
                'sku': g.sku,
                'name': g.name,
                'category': g.category,
                'quantity_total': tot,
                'quantity_available': g.quantity_available,
                'quantity_reserved': res,
                'quantity_under_maintenance': g.quantity_under_maintenance,
                'utilization_percentage': utilization,
            })
        return Response({
            'count': len(data),
            'inventory_utilization': data
        }, status=status.HTTP_200_OK)


class AnalyticsTopRentedGearView(APIView):
    """
    GET /api/admin/analytics/gear/top-rented/
    Top 10 gear by real rental count.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        top_gear = (
            RentalReservation.objects.exclude(order__order_status='cancelled')
            .values('gear__gear_id', 'gear__sku', 'gear__name', 'gear__category')
            .annotate(rental_count=Count('id'))
            .order_by('-rental_count')[:10]
        )
        results = [
            {
                'gear_id': item['gear__gear_id'],
                'sku': item['gear__sku'],
                'name': item['gear__name'],
                'category': item['gear__category'],
                'rental_count': item['rental_count']
            }
            for item in top_gear
        ]
        return Response({
            'count': len(results),
            'top_rented_gear': results
        }, status=status.HTTP_200_OK)


class AnalyticsPendingReturnsView(APIView):
    """
    GET /api/admin/analytics/returns/pending/
    Orders with overdue return dates that have not completed returns.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        overdue_orders = Order.objects.filter(
            return_completed=False,
            return_date__lt=now
        ).exclude(order_status='cancelled').order_by('return_date')

        serializer = OrderListSerializer(overdue_orders, many=True)
        return Response({
            'count': overdue_orders.count(),
            'pending_returns': serializer.data
        }, status=status.HTTP_200_OK)


# ==========================================
# Module 6 — CSV Export (Admin-Only)
# ==========================================

class ExportOrdersCsvView(APIView):
    """
    GET /api/admin/export/orders/
    Export orders dataset as CSV.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="orders_export.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'order_id', 'customer_email', 'destination', 'order_status',
            'reservation_status', 'rental_start_date', 'rental_end_date',
            'rental_days', 'daily_rental_price', 'total_amount', 'payment_status', 'created_at'
        ])
        for order in Order.objects.select_related('customer').order_by('-created_at'):
            writer.writerow([
                order.order_id,
                order.customer.email if order.customer else order.customer_email,
                order.destination,
                order.order_status,
                order.reservation_status,
                order.rental_start_date,
                order.rental_end_date,
                order.rental_days,
                order.daily_rental_price,
                order.total_amount,
                order.payment_status,
                order.created_at.strftime('%Y-%m-%d %H:%M:%S') if order.created_at else ''
            ])
        return response


class ExportRentalsCsvView(APIView):
    """
    GET /api/admin/export/rentals/
    Export rentals / reservations dataset as CSV.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="rentals_export.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'id', 'order_id', 'gear_id', 'gear_sku', 'gear_name',
            'rental_start_date', 'rental_end_date', 'reservation_status', 'created_at'
        ])
        for r in RentalReservation.objects.select_related('order', 'gear').order_by('-created_at'):
            writer.writerow([
                r.id,
                r.order.order_id if r.order else '',
                r.gear.gear_id if r.gear else '',
                r.gear.sku if r.gear else '',
                r.gear.name if r.gear else '',
                r.rental_start_date,
                r.rental_end_date,
                r.reservation_status,
                r.created_at.strftime('%Y-%m-%d %H:%M:%S') if r.created_at else ''
            ])
        return response


class ExportCustomersCsvView(APIView):
    """
    GET /api/admin/export/customers/
    Export customers dataset as CSV.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        from django.contrib.auth.models import User
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="customers_export.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'id', 'username', 'email', 'first_name', 'last_name',
            'total_orders', 'is_staff', 'date_joined'
        ])
        users = User.objects.annotate(order_count=Count('orders')).order_by('-date_joined')
        for u in users:
            writer.writerow([
                u.id,
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                u.order_count,
                u.is_staff,
                u.date_joined.strftime('%Y-%m-%d %H:%M:%S') if u.date_joined else ''
            ])
        return response


class ExportInventoryCsvView(APIView):
    """
    GET /api/admin/export/inventory/
    Export gear inventory dataset as CSV.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="inventory_export.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'gear_id', 'sku', 'name', 'category', 'brand', 'size',
            'condition', 'purchase_price', 'rental_price_per_day',
            'quantity_total', 'quantity_available', 'quantity_reserved',
            'quantity_under_maintenance', 'sanitized_at', 'inspection_due'
        ])
        for g in Gear.objects.all().order_by('name'):
            writer.writerow([
                g.gear_id,
                g.sku,
                g.name,
                g.category,
                g.brand,
                g.size,
                g.condition,
                g.purchase_price,
                g.daily_rental_price,
                g.quantity_total,
                g.quantity_available,
                g.quantity_reserved,
                g.quantity_under_maintenance,
                g.sanitized_at.strftime('%Y-%m-%d %H:%M:%S') if g.sanitized_at else '',
                g.inspection_due.strftime('%Y-%m-%d') if g.inspection_due else ''
            ])
        return response


class AdminGearListView(APIView):
    """
    GET /api/admin/gear/ - List all gear with inventory details
    POST /api/admin/gear/ - Create new gear item
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        gears = Gear.objects.all().order_by('name')
        serializer = GearSerializer(gears, many=True)
        return Response({'count': gears.count(), 'gear': serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data.copy()
        if not data.get('gear_id'):
            import uuid
            data['gear_id'] = f"gear-{uuid.uuid4().hex[:8]}"
        serializer = GearSerializer(data=data)
        if serializer.is_valid():
            gear = serializer.save()
            return Response({'message': 'Gear created successfully.', 'gear': GearSerializer(gear).data}, status=status.HTTP_201_CREATED)
        return Response({'message': 'Validation failed.', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class AdminGearDetailView(APIView):
    """
    GET /api/admin/gear/<str:gear_id>/ - Retrieve gear
    PATCH /api/admin/gear/<str:gear_id>/ - Update gear
    DELETE /api/admin/gear/<str:gear_id>/ - Delete gear
    """
    permission_classes = [IsAdminUser]

    def get_object(self, gear_id):
        return Gear.objects.filter(gear_id__iexact=gear_id).first() or get_object_or_404(Gear, gear_id=gear_id)

    def get(self, request, gear_id):
        gear = self.get_object(gear_id)
        return Response({'gear': GearSerializer(gear).data}, status=status.HTTP_200_OK)

    def patch(self, request, gear_id):
        gear = self.get_object(gear_id)
        serializer = GearSerializer(gear, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response({'message': 'Gear updated successfully.', 'gear': GearSerializer(updated).data}, status=status.HTTP_200_OK)
        return Response({'message': 'Update failed.', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, gear_id):
        gear = self.get_object(gear_id)
        gear.delete()
        return Response({'message': 'Gear deleted successfully.'}, status=status.HTTP_200_OK)


class AdminDeliveryPartnerView(APIView):
    """
    GET /api/admin/delivery-partners/ - List delivery partners with assigned order counts
    PATCH /api/admin/delivery-partners/<int:partner_id>/ - Update status/details
    """
    permission_classes = [IsAdminUser]

    def get(self, request, partner_id=None):
        if partner_id:
            partner = get_object_or_404(DeliveryPartner, id=partner_id)
            orders = partner.deliveries.all().order_by('-created_at')
            return Response({
                'partner': DeliveryPartnerSerializer(partner).data,
                'orders': OrderListSerializer(orders, many=True).data
            }, status=status.HTTP_200_OK)

        partners = DeliveryPartner.objects.all().order_by('name')
        data = []
        for p in partners:
            p_data = DeliveryPartnerSerializer(p).data
            p_data['assigned_orders_count'] = p.deliveries.filter(order_status__in=['packed', 'shipped', 'out_for_delivery']).count()
            data.append(p_data)
        return Response({'count': len(data), 'delivery_partners': data}, status=status.HTTP_200_OK)

    def patch(self, request, partner_id):
        partner = get_object_or_404(DeliveryPartner, id=partner_id)
        serializer = DeliveryPartnerSerializer(partner, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response({'message': 'Delivery partner updated.', 'partner': DeliveryPartnerSerializer(updated).data}, status=status.HTTP_200_OK)
        return Response({'message': 'Update failed.', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class AdminCustomerListView(APIView):
    """
    GET /api/admin/customers/ - List customers with stats
    GET /api/admin/customers/<int:user_id>/ - Get customer details
    """
    permission_classes = [IsAdminUser]

    def get(self, request, user_id=None):
        from django.contrib.auth.models import User
        if user_id:
            user = get_object_or_404(User, id=user_id)
            orders = user.orders.all().order_by('-created_at')
            from users.models import Notification
            notifications = Notification.objects.filter(user=user).order_by('-created_at')[:10]
            phone = user.profile.phone_number if hasattr(user, 'profile') else ''
            total_spend = orders.filter(payment_status__in=['paid', 'cod_pending']).aggregate(tot=Sum('total_amount'))['tot'] or Decimal('0.00')
            return Response({
                'id': user.id,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'email': user.email,
                'phone': phone,
                'date_joined': user.date_joined.strftime('%Y-%m-%d') if user.date_joined else '',
                'total_orders': orders.count(),
                'lifetime_spend': str(total_spend),
                'orders': OrderListSerializer(orders, many=True).data,
                'notifications_count': notifications.count(),
            }, status=status.HTTP_200_OK)

        users = User.objects.all().order_by('-date_joined')
        data = []
        for u in users:
            orders = u.orders.all()
            paid_spend = orders.filter(payment_status__in=['paid', 'cod_pending']).aggregate(tot=Sum('total_amount'))['tot'] or Decimal('0.00')
            current_rental = orders.filter(reservation_status__in=['Active', 'Upcoming']).first()
            phone = u.profile.phone_number if hasattr(u, 'profile') else ''
            data.append({
                'id': u.id,
                'name': f"{u.first_name} {u.last_name}".strip() or u.username,
                'email': u.email,
                'phone': phone,
                'date_joined': u.date_joined.strftime('%Y-%m-%d') if u.date_joined else '',
                'total_orders': orders.count(),
                'lifetime_spend': str(paid_spend),
                'current_rental': current_rental.order_id if current_rental else None,
                'is_staff': u.is_staff,
            })
        return Response({'count': len(data), 'customers': data}, status=status.HTTP_200_OK)


class AdminReservationListView(APIView):
    """
    GET /api/admin/reservations/ - List all rental reservations
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        reservations = RentalReservation.objects.select_related('gear', 'order', 'order__customer').order_by('-created_at')
        serializer = RentalReservationSerializer(reservations, many=True)
        return Response({'count': reservations.count(), 'reservations': serializer.data}, status=status.HTTP_200_OK)


class GlobalSearchView(APIView):
    """
    GET /api/search/?q=<query>
    Server-side search using PostgreSQL and Django ORM.
    Returns structured results for gear/products, categories, destinations, and adventure kits.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({
                'query': '',
                'count': 0,
                'gear': [],
                'categories': [],
                'destinations': [],
                'kits': []
            }, status=status.HTTP_200_OK)

        clean_q = query[:100]

        # 1. Gear / Products Search (limit 8)
        gear_qs = Gear.objects.filter(
            Q(name__icontains=clean_q) |
            Q(category__icontains=clean_q) |
            Q(brand__icontains=clean_q) |
            Q(sku__icontains=clean_q)
        ).exclude(category='Adventure Kit').distinct()[:8]

        gear_results = []
        for g in gear_qs:
            gear_results.append({
                'id': g.gear_id,
                'name': g.name,
                'category': g.category or 'Trekking Gear',
                'brand': g.brand or 'PeakKit',
                'price': str(g.daily_rental_price),
                'url': f"/explore?q={g.name}"
            })

        # 2. Adventure Kits Search (limit 6)
        seen_kit_slugs = set()
        kits_results = []

        from rentals.models import AdventureKit
        adv_kits = AdventureKit.objects.filter(
            Q(name__icontains=clean_q) |
            Q(destination__icontains=clean_q) |
            Q(description__icontains=clean_q)
        ).distinct()[:6]

        for ak in adv_kits:
            seen_kit_slugs.add(ak.slug)
            kits_results.append({
                'id': ak.kit_id,
                'name': ak.name,
                'destination': ak.destination,
                'category': 'Adventure Kit',
                'price': str(ak.total_daily_price),
                'url': f"/adventure-kit/{ak.slug}"
            })

        kits_qs = Gear.objects.filter(
            category='Adventure Kit'
        ).filter(
            Q(name__icontains=clean_q) |
            Q(brand__icontains=clean_q)
        ).distinct()[:6]

        for k in kits_qs:
            kit_slug = k.gear_id.replace('kit-', '')
            if kit_slug not in seen_kit_slugs:
                seen_kit_slugs.add(kit_slug)
                kits_results.append({
                    'id': k.gear_id,
                    'name': k.name,
                    'category': 'Adventure Kit',
                    'url': f"/adventure-kit/{kit_slug}"
                })

        # 3. Categories matching query
        STANDARD_CATEGORIES = [
            'Backpacks', 'Jackets', 'Sleeping Bags', 'Camping',
            'Footwear', 'Cooking', 'Safety', 'Accessories'
        ]
        matched_categories = set(
            Gear.objects.filter(category__icontains=clean_q)
            .exclude(category='Adventure Kit')
            .values_list('category', flat=True)
            .distinct()[:5]
        )
        for cat in STANDARD_CATEGORIES:
            if clean_q.lower() in cat.lower():
                matched_categories.add(cat)

        categories_results = [
            {
                'name': cat,
                'url': f"/explore?category={cat}"
            }
            for cat in sorted(matched_categories) if cat
        ][:5]

        # 4. Destinations matching query
        STANDARD_DESTINATIONS = [
            'Everest Base Camp', 'Annapurna Base Camp', 'Langtang Valley',
            'Mardi Himal', 'Gosaikunda', 'Upper Mustang', 'Manaslu Circuit',
            'Ama Yangri', 'Shivapuri', 'Poon Hill', 'Rara Lake'
        ]
        matched_destinations = set(
            Order.objects.filter(destination__icontains=clean_q)
            .values_list('destination', flat=True)
            .distinct()[:5]
        )
        for dest in STANDARD_DESTINATIONS:
            if clean_q.lower() in dest.lower():
                matched_destinations.add(dest)

        destinations_results = [
            {
                'name': dest,
                'url': f"/adventure-kit/{dest.lower().replace(' ', '-')}"
            }
            for dest in sorted(matched_destinations) if dest
        ][:5]

        total_count = len(gear_results) + len(categories_results) + len(destinations_results) + len(kits_results)

        return Response({
            'query': clean_q,
            'count': total_count,
            'gear': gear_results,
            'categories': categories_results,
            'destinations': destinations_results,
            'kits': kits_results
        }, status=status.HTTP_200_OK)


# ==========================================
# Module 7 — Public Gear & Adventure Kits
# ==========================================

class GearListView(APIView):
    """
    GET /api/gear/
    Public listing of all available rental gear with filtering by category, brand, condition, and search query.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        category = request.query_params.get('category')
        brand = request.query_params.get('brand')
        condition = request.query_params.get('condition')
        search = request.query_params.get('q')
        sort_by = request.query_params.get('sort', 'popular')

        qs = Gear.objects.all()
        if category and category != 'All gear':
            qs = qs.filter(category__iexact=category)
        if brand:
            qs = qs.filter(brand__iexact=brand)
        if condition:
            qs = qs.filter(condition__iexact=condition)
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(brand__icontains=search) | Q(category__icontains=search))

        if sort_by == 'price_low':
            qs = qs.order_by('daily_rental_price')
        elif sort_by == 'price_high':
            qs = qs.order_by('-daily_rental_price')
        else:
            qs = qs.order_by('-quantity_available', 'name')

        serializer = GearSerializer(qs, many=True)
        return Response({
            'count': qs.count(),
            'gear': serializer.data
        }, status=status.HTTP_200_OK)


class GearDetailView(APIView):
    """
    GET /api/gear/<gear_id>/
    Get detailed information about a specific gear item.
    """
    permission_classes = [AllowAny]

    def get(self, request, gear_id):
        gear = Gear.objects.filter(gear_id=gear_id).first() or get_object_or_404(
            Gear, id=int(gear_id) if str(gear_id).isdigit() else 0
        )
        serializer = GearSerializer(gear)
        return Response({
            'gear': serializer.data
        }, status=status.HTTP_200_OK)


class AdventureKitListView(APIView):
    """
    GET /api/kits/
    Public list of adventure kits with dynamic availability and constituent items.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        category = request.query_params.get('category')
        destination = request.query_params.get('destination')
        qs = AdventureKit.objects.filter(is_active=True).prefetch_related('items__gear')
        if category:
            qs = qs.filter(category__iexact=category)
        if destination:
            qs = qs.filter(destination__icontains=destination)

        serializer = AdventureKitSerializer(qs, many=True)
        return Response({
            'count': qs.count(),
            'kits': serializer.data
        }, status=status.HTTP_200_OK)


class AdventureKitDetailView(APIView):
    """
    GET /api/kits/<slug>/
    Get detailed kit by slug with all constituent items and dynamic availability.
    """
    permission_classes = [AllowAny]

    def get(self, request, slug):
        kit = get_object_or_404(AdventureKit.objects.prefetch_related('items__gear'), slug=slug)
        serializer = AdventureKitSerializer(kit)
        return Response({
            'kit': serializer.data
        }, status=status.HTTP_200_OK)


class AdminKitListView(APIView):
    """
    GET /api/admin/kits/ - List all kits
    POST /api/admin/kits/ - Create new Adventure Kit bundle with items
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        kits = AdventureKit.objects.all().prefetch_related('items__gear')
        serializer = AdventureKitSerializer(kits, many=True)
        return Response({'count': kits.count(), 'kits': serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data
        name = data.get('name')
        if not name:
            return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)

        import re
        slug = data.get('slug') or re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        kit_id = data.get('kit_id') or f"KIT-{slug.upper()[:12]}"

        kit, _ = AdventureKit.objects.update_or_create(
            slug=slug,
            defaults={
                'kit_id': kit_id,
                'name': name,
                'category': data.get('category', 'Trekking'),
                'destination': data.get('destination', ''),
                'difficulty': data.get('difficulty', 'Moderate'),
                'duration_days': data.get('duration_days', '7-10 days'),
                'base_discount_percent': int(data.get('base_discount_percent', 20)),
                'banner_image': data.get('banner_image', '/images/packages/ebc-kit.jpg'),
                'description': data.get('description', ''),
                'season': data.get('season', 'All year'),
            }
        )

        items_data = data.get('items', [])
        if items_data:
            AdventureKitItem.objects.filter(kit=kit).delete()
            for item in items_data:
                g_id = item.get('gear_id') or item.get('gear')
                gear_obj = Gear.objects.filter(Q(gear_id=g_id) | Q(pk=int(g_id) if str(g_id).isdigit() else 0)).first()
                if gear_obj:
                    AdventureKitItem.objects.create(
                        kit=kit,
                        gear=gear_obj,
                        quantity=int(item.get('quantity', 1)),
                        is_optional=bool(item.get('is_optional', False)),
                    )

        serializer = AdventureKitSerializer(kit)
        return Response({'message': 'Kit bundle saved successfully', 'kit': serializer.data}, status=status.HTTP_201_CREATED)


class AdminKitDetailView(APIView):
    """
    PATCH /api/admin/kits/<kit_id>/
    DELETE /api/admin/kits/<kit_id>/
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, kit_id):
        kit = get_object_or_404(AdventureKit, Q(kit_id=kit_id) | Q(id=int(kit_id) if str(kit_id).isdigit() else 0))
        for field in ['name', 'category', 'destination', 'difficulty', 'duration_days', 'base_discount_percent', 'banner_image', 'description', 'season', 'is_active']:
            if field in request.data:
                setattr(kit, field, request.data[field])
        kit.save()

        if 'items' in request.data:
            AdventureKitItem.objects.filter(kit=kit).delete()
            for item in request.data['items']:
                g_id = item.get('gear_id') or item.get('gear')
                gear_obj = Gear.objects.filter(Q(gear_id=g_id) | Q(pk=int(g_id) if str(g_id).isdigit() else 0)).first()
                if gear_obj:
                    AdventureKitItem.objects.create(
                        kit=kit,
                        gear=gear_obj,
                        quantity=int(item.get('quantity', 1)),
                        is_optional=bool(item.get('is_optional', False)),
                    )

        serializer = AdventureKitSerializer(kit)
        return Response({'message': 'Kit updated', 'kit': serializer.data}, status=status.HTTP_200_OK)

    def delete(self, request, kit_id):
        kit = get_object_or_404(AdventureKit, Q(kit_id=kit_id) | Q(id=int(kit_id) if str(kit_id).isdigit() else 0))
        kit.delete()
        return Response({'message': 'Kit deleted successfully'}, status=status.HTTP_200_OK)

