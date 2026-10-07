from django.urls import path
from .views import (
    RecommendationsForYouView,
    SimilarGearView,
    CustomersAlsoRentedView,
    TrendingGearView,
    KitAddonsView,
    CompleteYourKitView,
    GearAdvisorSolverView,
    RecommendationEventView,
    RecommendationAnalyticsView,
    MarketingEventCreateView,
    MarketingSummaryView,
    SEOHealthReportView,
)

app_name = 'recommendations'

urlpatterns = [
    path('for-you/', RecommendationsForYouView.as_view(), name='recommendations-for-you'),
    path('similar/<str:gear_id>/', SimilarGearView.as_view(), name='recommendations-similar'),
    path('customers-also-rented/<str:gear_id>/', CustomersAlsoRentedView.as_view(), name='recommendations-co-rented'),
    path('trending/', TrendingGearView.as_view(), name='recommendations-trending'),
    path('kit-addons/', KitAddonsView.as_view(), name='recommendations-kit-addons'),
    path('complete-your-kit/', CompleteYourKitView.as_view(), name='recommendations-complete-kit'),
    path('gear-advisor/', GearAdvisorSolverView.as_view(), name='recommendations-gear-advisor'),
    path('event/', RecommendationEventView.as_view(), name='recommendations-event'),
    path('analytics/', RecommendationAnalyticsView.as_view(), name='recommendations-analytics'),
    path('marketing/events/', MarketingEventCreateView.as_view(), name='marketing-events'),
    path('marketing/summary/', MarketingSummaryView.as_view(), name='marketing-summary'),
    path('marketing/seo-health/', SEOHealthReportView.as_view(), name='marketing-seo-health'),
]
