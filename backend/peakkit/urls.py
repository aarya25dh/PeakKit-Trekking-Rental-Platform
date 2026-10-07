"""
URL configuration for peakkit project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

import os
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse

from recommendations.views import (
    MarketingEventCreateView,
    MarketingSummaryView,
    SEOHealthReportView,
)

def robots_txt_view(request):
    robots_path = os.path.join(settings.BASE_DIR, "..", "frontend", "public", "robots.txt")
    if os.path.exists(robots_path):
        with open(robots_path, "r") as f:
            content = f.read()
    else:
        content = "User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n"
    return HttpResponse(content, content_type="text/plain; charset=utf-8")

def sitemap_xml_view(request):
    sitemap_path = os.path.join(settings.BASE_DIR, "..", "frontend", "public", "sitemap.xml")
    if os.path.exists(sitemap_path):
        with open(sitemap_path, "r") as f:
            content = f.read()
    else:
        content = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
    return HttpResponse(content, content_type="application/xml; charset=utf-8")

urlpatterns = [
    path("robots.txt", robots_txt_view, name="robots-txt"),
    path("sitemap.xml", sitemap_xml_view, name="sitemap-xml"),
    path("admin/", admin.site.urls),
    path("api/", include("users.urls")),
    path("api/", include("rentals.urls")),
    path("api/recommendations/", include("recommendations.urls")),
    path("api/marketing/events/", MarketingEventCreateView.as_view(), name="root-marketing-events"),
    path("api/marketing/summary/", MarketingSummaryView.as_view(), name="root-marketing-summary"),
    path("api/marketing/seo-health/", SEOHealthReportView.as_view(), name="root-marketing-seo-health"),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

