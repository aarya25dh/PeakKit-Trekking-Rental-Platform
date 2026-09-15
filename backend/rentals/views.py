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
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth

from .models import Order, TrackingEvent, DeliveryPartner, Gear, RentalReservation, CartItem, GearReturn
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

        return Response({
            'total_orders': total_orders,
            'total_revenue': str(paid_revenue),
            'active_rentals': active_rentals,
            'pending_returns': pending_returns,
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
