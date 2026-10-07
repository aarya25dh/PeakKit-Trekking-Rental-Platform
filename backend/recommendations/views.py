from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from .services import (
    get_recommendations_for_user,
    get_similar_gear,
    get_customers_also_rented,
    get_trending_gear,
    get_kit_addons,
    get_complete_your_kit,
    solve_gear_advisor,
    log_recommendation_event,
    get_recommendation_analytics,
    record_marketing_event,
    get_marketing_analytics,
    get_seo_health_report,
)


class CompleteYourKitView(APIView):
    """
    GET /api/recommendations/complete-your-kit/
    Returns top 2 adventure kits and top 3 accessory/safety items.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user if request.user.is_authenticated else None
        data = get_complete_your_kit(user=user, limit_items=3, limit_kits=2)
        return Response(data, status=status.HTTP_200_OK)


class MarketingEventCreateView(APIView):
    """
    POST /api/marketing/events/
    Ingests live frontend marketing and user interaction events into PostgreSQL.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        event_name = request.data.get("name") or request.data.get("event_name", "page_view")
        page_path = request.data.get("path") or request.data.get("url") or "/"
        referrer = request.data.get("referrer", "")
        traffic_source = request.data.get("traffic_source") or request.data.get("source") or "Direct"
        device_category = request.data.get("device") or request.data.get("device_category") or "Desktop"
        payload = request.data.get("params") or request.data.get("payload") or {}
        session_id = request.data.get("session_id", "")

        event = record_marketing_event(
            event_name=event_name,
            page_path=page_path,
            referrer=referrer,
            traffic_source=traffic_source,
            device_category=device_category,
            payload=payload,
            session_id=session_id,
            user=request.user
        )

        return Response({
            "status": "success",
            "event_id": event.id,
            "event_name": event.event_name
        }, status=status.HTTP_201_CREATED)


class MarketingSummaryView(APIView):
    """
    GET /api/marketing/summary/
    Admin marketing dashboard analytics computed dynamically from PostgreSQL.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        summary = get_marketing_analytics()
        return Response(summary, status=status.HTTP_200_OK)


class SEOHealthReportView(APIView):
    """
    GET /api/marketing/seo-health/
    Dynamic evaluation of SEO tags, schemas, and canonical setup across routes.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        report = get_seo_health_report()
        return Response(report, status=status.HTTP_200_OK)


class RecommendationsForYouView(APIView):
    """
    GET /api/recommendations/for-you/
    Returns personalized gear recommendations for the current user or popular fallback.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        limit = int(request.query_params.get("limit", 3))
        user = request.user if request.user.is_authenticated else None
        results = get_recommendations_for_user(user=user, limit=limit)
        return Response({
            "type": "for_you",
            "count": len(results),
            "recommendations": results
        }, status=status.HTTP_200_OK)


class SimilarGearView(APIView):
    """
    GET /api/recommendations/similar/<gear_id>/
    Returns TF-IDF content similar gear items.
    """
    permission_classes = [AllowAny]

    def get(self, request, gear_id):
        limit = int(request.query_params.get("limit", 3))
        results = get_similar_gear(gear_id=gear_id, limit=limit)
        return Response({
            "gear_id": gear_id,
            "type": "similar_gear",
            "count": len(results),
            "recommendations": results
        }, status=status.HTTP_200_OK)


class CustomersAlsoRentedView(APIView):
    """
    GET /api/recommendations/customers-also-rented/<gear_id>/
    Returns collaborative filtering co-rented gear items.
    """
    permission_classes = [AllowAny]

    def get(self, request, gear_id):
        limit = int(request.query_params.get("limit", 3))
        results = get_customers_also_rented(gear_id=gear_id, limit=limit)
        return Response({
            "gear_id": gear_id,
            "type": "customers_also_rented",
            "count": len(results),
            "recommendations": results
        }, status=status.HTTP_200_OK)


class TrendingGearView(APIView):
    """
    GET /api/recommendations/trending/
    Returns trending equipment across Himalayan expeditions in the last 30 days.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        limit = int(request.query_params.get("limit", 4))
        results = get_trending_gear(limit=limit)
        return Response({
            "type": "trending",
            "count": len(results),
            "recommendations": results
        }, status=status.HTTP_200_OK)


class KitAddonsView(APIView):
    """
    GET /api/recommendations/kit-addons/
    Returns recommended accessories and safety add-ons.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        destination = request.query_params.get("destination", "Annapurna Base Camp")
        limit = int(request.query_params.get("limit", 3))
        results = get_kit_addons(destination=destination, limit=limit)
        return Response({
            "destination": destination,
            "type": "kit_addons",
            "count": len(results),
            "recommendations": results
        }, status=status.HTTP_200_OK)


class GearAdvisorSolverView(APIView):
    """
    POST /api/recommendations/gear-advisor/
    Dynamic AI Gear Advisor engine calculating expedition equipment, weight, and costs.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        answers = request.data or {}
        result = solve_gear_advisor(answers)
        return Response(result, status=status.HTTP_200_OK)


class RecommendationEventView(APIView):
    """
    POST /api/recommendations/event/
    Records a recommendation impression or click.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        rec_type = request.data.get("rec_type", "for_you")
        gear_id = request.data.get("gear_id")
        action = request.data.get("action", "click")

        if not gear_id:
            return Response({"error": "gear_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        log = log_recommendation_event(
            rec_type=rec_type,
            gear_id=gear_id,
            action=action,
            user=request.user
        )

        return Response({
            "status": "recorded",
            "id": log.id,
            "action": action
        }, status=status.HTTP_201_CREATED)


class RecommendationAnalyticsView(APIView):
    """
    GET /api/recommendations/analytics/
    Admin endpoint returning recommendation CTR and top recommended items.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        data = get_recommendation_analytics()
        return Response(data, status=status.HTTP_200_OK)
