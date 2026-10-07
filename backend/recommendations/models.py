from django.db import models
from django.contrib.auth.models import User


class RecommendationLog(models.Model):
    """
    Tracks recommendation impressions and clicks to compute CTR and conversion lift.
    """
    ACTION_CHOICES = [
        ('impression', 'Impression'),
        ('click', 'Click'),
        ('conversion', 'Conversion'),
    ]

    rec_type = models.CharField(max_length=50, db_index=True)
    gear_id = models.CharField(max_length=100, db_index=True)
    gear_name = models.CharField(max_length=255, blank=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, default='impression')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Recommendation Log"
        verbose_name_plural = "Recommendation Logs"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.rec_type} - {self.gear_id} ({self.action})"


class MarketingEvent(models.Model):
    """
    Stores raw customer analytics and marketing funnel events in PostgreSQL.
    """
    EVENT_CHOICES = [
        ('page_view', 'Page View'),
        ('view_item', 'View Item'),
        ('search', 'Search'),
        ('add_to_cart', 'Add to Cart'),
        ('add_to_wishlist', 'Add to Wishlist'),
        ('begin_checkout', 'Begin Checkout'),
        ('purchase', 'Purchase'),
        ('recommendation_click', 'Recommendation Click'),
    ]

    event_name = models.CharField(max_length=50, choices=EVENT_CHOICES, db_index=True)
    session_id = models.CharField(max_length=100, db_index=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    page_path = models.CharField(max_length=255, db_index=True)
    referrer = models.CharField(max_length=255, blank=True)
    traffic_source = models.CharField(max_length=100, default='Direct')
    device_category = models.CharField(max_length=50, default='Desktop')
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Marketing Event"
        verbose_name_plural = "Marketing Events"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_name} @ {self.page_path} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
