from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from rentals.models import Gear, Order
from .models import RecommendationLog


class RecommendationSystemTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="trekker_rec",
            email="trekker_rec@example.com",
            password="securePassword123"
        )
        self.staff_user = User.objects.create_user(
            username="staff_rec",
            email="staff_rec@example.com",
            password="securePassword123",
            is_staff=True
        )

        self.gear1 = Gear.objects.create(
            gear_id="GEAR-TEST-01",
            name="Expedition Backpack 65L",
            category="Backpacks",
            brand="Osprey",
            daily_rental_price=450.00,
            quantity_total=5,
            quantity_available=5
        )
        self.gear2 = Gear.objects.create(
            gear_id="GEAR-TEST-02",
            name="Alpine Tent 2P",
            category="Camping",
            brand="Black Diamond",
            daily_rental_price=600.00,
            quantity_total=3,
            quantity_available=3
        )

    def test_for_you_recommendations(self):
        response = self.client.get("/api/recommendations/for-you/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("recommendations", response.data)
        self.assertGreaterEqual(len(response.data["recommendations"]), 1)

    def test_similar_gear_recommendations(self):
        response = self.client.get(f"/api/recommendations/similar/{self.gear1.gear_id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("recommendations", response.data)

    def test_trending_gear(self):
        response = self.client.get("/api/recommendations/trending/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("recommendations", response.data)

    def test_kit_addons(self):
        response = self.client.get("/api/recommendations/kit-addons/?destination=Annapurna")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("recommendations", response.data)

    def test_record_recommendation_event(self):
        payload = {
            "rec_type": "for_you",
            "gear_id": self.gear1.gear_id,
            "action": "click"
        }
        response = self.client.post("/api/recommendations/event/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(RecommendationLog.objects.filter(gear_id=self.gear1.gear_id).exists())

    def test_recommendation_analytics_permission(self):
        # Anonymous should be unauthorized / forbidden
        response = self.client.get("/api/recommendations/analytics/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Staff user should get 200
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get("/api/recommendations/analytics/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("ctr", response.data)
        self.assertIn("total_impressions", response.data)

    def test_gear_advisor_solver(self):
        payload = {
            "destination": "Everest Base Camp",
            "activity": "Trekking",
            "experience": "Intermediate",
            "duration": "8–12 Days",
            "season": "Autumn",
            "accommodation": "Tea House",
            "budget": 10000,
            "extras": ["Headlamp", "First Aid Kit"]
        }
        response = self.client.post("/api/recommendations/gear-advisor/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("confidence_score", response.data)
        self.assertIn("metrics", response.data)
        self.assertIn("groups", response.data)
        self.assertGreater(len(response.data["groups"]), 0)

    def test_customers_also_rented(self):
        response = self.client.get(f"/api/recommendations/customers-also-rented/{self.gear1.gear_id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("recommendations", response.data)

    def test_complete_your_kit(self):
        response = self.client.get("/api/recommendations/complete-your-kit/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("kits", response.data)
        self.assertIn("items", response.data)

    def test_marketing_event_recording(self):
        payload = {
            "name": "page_view",
            "path": "/explore",
            "traffic_source": "Google Organic",
            "device": "Mobile",
            "params": {"category": "Backpacks"}
        }
        response = self.client.post("/api/marketing/events/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["event_name"], "page_view")

    def test_marketing_summary_analytics(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get("/api/marketing/summary/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("visitors", response.data)
        self.assertIn("sessions", response.data)
        self.assertIn("conversionRate", response.data)

    def test_seo_health_report(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get("/api/marketing/seo-health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("overall_score", response.data)
        self.assertIn("routes", response.data)


