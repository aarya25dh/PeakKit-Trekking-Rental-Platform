from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

from users.models import Profile, Notification
from rentals.models import (
    Order, DeliveryPartner, TrackingEvent, Gear, GearReturn,
    RentalReservation, CartItem, AdventureKit, AdventureKitItem, OrderItem
)
from recommendations.models import RecommendationLog, MarketingEvent
from rentals.status_engine import OrderStatusEngine


class Command(BaseCommand):
    help = "Destructive clean application data reset and seed for PeakKit."

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Starting CLEAN DATA RESET for PeakKit..."))

        # ==========================================
        # STEP 1: CLEAN APPLICATION DATA RESET
        # ==========================================
        self.stdout.write("Purging existing application demo records...")

        # Purge in dependency order
        MarketingEvent.objects.all().delete()
        RecommendationLog.objects.all().delete()
        Notification.objects.all().delete()
        GearReturn.objects.all().delete()
        TrackingEvent.objects.all().delete()
        OrderItem.objects.all().delete()
        RentalReservation.objects.all().delete()
        Order.objects.all().delete()
        CartItem.objects.all().delete()
        AdventureKitItem.objects.all().delete()
        AdventureKit.objects.all().delete()
        Gear.objects.all().delete()
        DeliveryPartner.objects.all().delete()

        # Delete all users and their profiles
        User.objects.all().delete()

        self.stdout.write(self.style.SUCCESS("✓ Application database reset completed!"))

        # ==========================================
        # STEP 2: CREATE EXACT TEST ACCOUNTS
        # ==========================================
        self.stdout.write("Creating exact customer, partner, and admin accounts...")

        # 1. Five Customers
        CUSTOMERS_SPEC = [
            {
                "username": "maya.shrestha",
                "email": "maya.shrestha@peakkit.test",
                "password": "PeakKit@Maya2026!",
                "first_name": "Maya",
                "last_name": "Shrestha",
                "phone": "9841000001",
                "city": "Kathmandu",
                "address": "Baluwatar, Kathmandu",
            },
            {
                "username": "aarav.koirala",
                "email": "aarav.koirala@peakkit.test",
                "password": "PeakKit@Aarav2026!",
                "first_name": "Aarav",
                "last_name": "Koirala",
                "phone": "9841000002",
                "city": "Pokhara",
                "address": "Lakeside-6, Pokhara",
            },
            {
                "username": "nisha.gurung",
                "email": "nisha.gurung@peakkit.test",
                "password": "PeakKit@Nisha2026!",
                "first_name": "Nisha",
                "last_name": "Gurung",
                "phone": "9841000003",
                "city": "Kathmandu",
                "address": "Lazimpat, Kathmandu",
            },
            {
                "username": "rohan.adhikari",
                "email": "rohan.adhikari@peakkit.test",
                "password": "PeakKit@Rohan2026!",
                "first_name": "Rohan",
                "last_name": "Adhikari",
                "phone": "9841000004",
                "city": "Lalitpur",
                "address": "Jhamsikhel, Lalitpur",
            },
            {
                "username": "elina.rai",
                "email": "elina.rai@peakkit.test",
                "password": "PeakKit@Elina2026!",
                "first_name": "Elina",
                "last_name": "Rai",
                "phone": "9841000005",
                "city": "Bhaktapur",
                "address": "Sallaghari, Bhaktapur",
            },
        ]

        customer_users = {}
        for c in CUSTOMERS_SPEC:
            u = User.objects.create_user(
                username=c["username"],
                email=c["email"],
                password=c["password"],
                first_name=c["first_name"],
                last_name=c["last_name"],
                is_staff=False,
                is_superuser=False,
            )
            profile, _ = Profile.objects.get_or_create(user=u)
            profile.phone_number = c["phone"]
            profile.city = c["city"]
            profile.address = c["address"]
            profile.email_verified = True
            profile.save()
            customer_users[c["username"]] = u
            self.stdout.write(f"  + Customer: {u.get_full_name()} ({u.email})")

        # 2. Five Delivery Partners
        PARTNERS_SPEC = [
            {
                "username": "suman.tamang",
                "email": "suman.tamang@peakkit.test",
                "password": "PeakKit@Suman2026!",
                "name": "Suman Tamang",
                "phone": "9841112233",
                "vehicle_type": "bike",
                "vehicle_number": "BA 2 PA 4521",
                "location": "Kathmandu Warehouse Hub",
            },
            {
                "username": "prabin.lama",
                "email": "prabin.lama@peakkit.test",
                "password": "PeakKit@Prabin2026!",
                "name": "Prabin Lama",
                "phone": "9842223344",
                "vehicle_type": "scooter",
                "vehicle_number": "BA 3 PA 8912",
                "location": "Lalitpur Hub",
            },
            {
                "username": "kiran.thapa",
                "email": "kiran.thapa@peakkit.test",
                "password": "PeakKit@Kiran2026!",
                "name": "Kiran Thapa",
                "phone": "9843334455",
                "vehicle_type": "bike",
                "vehicle_number": "GA 1 PA 7845",
                "location": "Pokhara Hub",
            },
            {
                "username": "bikash.magar",
                "email": "bikash.magar@peakkit.test",
                "password": "PeakKit@Bikash2026!",
                "name": "Bikash Magar",
                "phone": "9844445566",
                "vehicle_type": "van",
                "vehicle_number": "BA 1 JA 3390",
                "location": "Bhaktapur Hub",
            },
            {
                "username": "anisha.gurung",
                "email": "anisha.gurung@peakkit.test",
                "password": "PeakKit@Anisha2026!",
                "name": "Anisha Gurung",
                "phone": "9845556677",
                "vehicle_type": "scooter",
                "vehicle_number": "BA 4 PA 1199",
                "location": "Chitwan Hub",
            },
        ]

        delivery_partners = []
        for p in PARTNERS_SPEC:
            u = User.objects.create_user(
                username=p["username"],
                email=p["email"],
                password=p["password"],
                first_name=p["name"].split()[0],
                last_name=p["name"].split()[1] if len(p["name"].split()) > 1 else "",
                is_staff=False,
                is_superuser=False,
            )
            profile, _ = Profile.objects.get_or_create(user=u)
            profile.phone_number = p["phone"]
            profile.email_verified = True
            profile.save()

            dp = DeliveryPartner.objects.create(
                name=p["name"],
                phone_number=p["phone"],
                whatsapp_number=p["phone"],
                email=p["email"],
                vehicle_type=p["vehicle_type"],
                vehicle_number=p["vehicle_number"],
                current_location=p["location"],
                available=True,
                rating=Decimal("4.9"),
                total_deliveries=random.randint(15, 60),
            )
            delivery_partners.append(dp)
            self.stdout.write(f"  + Delivery Partner: {dp.name} ({dp.vehicle_number})")

        # 3. Two Administrators
        ADMINS_SPEC = [
            {
                "username": "admin",
                "email": "admin@peakkit.test",
                "password": "PeakKit@Admin2026!",
                "first_name": "PeakKit",
                "last_name": "Administrator",
                "phone": "9860000001",
            },
            {
                "username": "operations.admin",
                "email": "operations@peakkit.test",
                "password": "PeakKit@Operations2026!",
                "first_name": "PeakKit",
                "last_name": "Operations",
                "phone": "9860000002",
            },
        ]

        for a in ADMINS_SPEC:
            u = User.objects.create_superuser(
                username=a["username"],
                email=a["email"],
                password=a["password"],
                first_name=a["first_name"],
                last_name=a["last_name"],
            )
            profile, _ = Profile.objects.get_or_create(user=u)
            profile.phone_number = a["phone"]
            profile.email_verified = True
            profile.save()
            self.stdout.write(f"  + Admin: {u.get_full_name()} ({u.username})")

        # ==========================================
        # STEP 3: SEED GEAR CATALOG & INVENTORY
        # ==========================================
        self.stdout.write("Seeding gear catalog and coherent inventory...")

        GEAR_CATALOG = [
            # Backpacks
            ("GEAR-BP-01", "Osprey Atmos AG 65L Trekking Pack", "Backpacks", "Osprey", "M", "new", 28000, 650, "/images/products/backpack1.jpg", 10),
            ("GEAR-BP-02", "Osprey Aura AG 50L (Women's)", "Backpacks", "Osprey", "S", "new", 26000, 600, "/images/products/backpack2.jpg", 8),
            ("GEAR-BP-03", "Deuter Aircontact Lite 45+10L Daypack", "Backpacks", "Deuter", "L", "good", 22000, 500, "/images/products/backpack3.jpg", 12),
            ("GEAR-BP-04", "Gregory Baltoro 75L Heavy Expedition", "Backpacks", "Gregory", "L", "good", 32000, 750, "/images/products/backpack4.jpg", 6),
            ("GEAR-BP-05", "Black Diamond Speed 30 Alpine Pack", "Backpacks", "Black Diamond", "M", "new", 18000, 420, "/images/products/backpack5.jpg", 8),
            ("GEAR-BP-06", "Lowe Alpine AirZone Pro 35L Daypack", "Backpacks", "Lowe Alpine", "M", "good", 20000, 450, "/images/products/backpack6.jpg", 7),

            # Jackets & Insulation
            ("GEAR-JK-01", "Patagonia Fitz Roy Down Hoody (-20°C)", "Jackets", "Patagonia", "L", "new", 38000, 580, "/images/products/jacket1.jpg", 15),
            ("GEAR-JK-02", "Rab Mythic Alpine Down Jacket", "Jackets", "Rab", "M", "new", 36000, 550, "/images/products/jacket2.jpg", 12),
            ("GEAR-JK-03", "Arc'teryx Alpha SV GORE-TEX Shell", "Jackets", "Arc'teryx", "L", "good", 45000, 700, "/images/products/jacket3.jpg", 8),
            ("GEAR-JK-04", "Mountain Hardwear Ghost Whisperer/2", "Jackets", "Mountain Hardwear", "M", "good", 28000, 480, "/images/products/jacket4.jpg", 10),
            ("GEAR-JK-05", "The North Face Summit L3 Ventrix", "Jackets", "The North Face", "XL", "good", 24000, 420, "/images/products/jacket5.jpg", 8),
            ("GEAR-JK-06", "Marmot Precip Eco Waterproof Rain Shell", "Jackets", "Marmot", "L", "new", 16000, 320, "/images/products/jacket6.jpg", 14),

            # Sleeping Bags
            ("GEAR-SB-01", "Rab Mythic Ultra 180 Down (-18°C)", "Sleeping Bags", "Rab", "One Size", "new", 42000, 650, "/images/products/sleepingbag1.jpg", 12),
            ("GEAR-SB-02", "Sea to Summit Spark SpIV 850 Down", "Sleeping Bags", "Sea to Summit", "One Size", "good", 39000, 600, "/images/products/sleepingbag2.jpg", 9),
            ("GEAR-SB-03", "Mountain Hardwear Phantom 0°F Expedition", "Sleeping Bags", "Mountain Hardwear", "One Size", "good", 35000, 550, "/images/products/sleepingbag3.jpg", 8),
            ("GEAR-SB-04", "Therm-a-Rest Questar 20F/ -6C", "Sleeping Bags", "Therm-a-Rest", "One Size", "good", 26000, 450, "/images/products/sleepingbag4.jpg", 10),
            ("GEAR-SB-05", "Nemo Sonic 0-Degree Down Bag", "Sleeping Bags", "Nemo", "One Size", "new", 44000, 680, "/images/products/sleepingbag5.jpg", 6),
            ("GEAR-SB-06", "Marmot Never Summer -18C Sleeping Bag", "Sleeping Bags", "Marmot", "One Size", "good", 33000, 520, "/images/products/sleepingbag6.jpg", 7),

            # Footwear
            ("GEAR-FW-01", "La Sportiva Nepal EVO GTX Mountaineering Boots", "Footwear", "La Sportiva", "42", "new", 48000, 750, "/images/products/boots1.jpg", 8),
            ("GEAR-FW-02", "Scarpa Zodiac Plus GTX Trekking Boots", "Footwear", "Scarpa", "43", "good", 29000, 480, "/images/products/boots2.jpg", 10),
            ("GEAR-FW-03", "Salomon Quest 4 GORE-TEX Hiking Boots", "Footwear", "Salomon", "41", "good", 24000, 420, "/images/products/boots3.jpg", 12),
            ("GEAR-FW-04", "Lowa Renegade GTX Mid All-Terrain", "Footwear", "Lowa", "42", "new", 27000, 460, "/images/products/boots4.jpg", 9),
            ("GEAR-FW-05", "Hoka Anacapa Mid Waterproof Boots", "Footwear", "Hoka", "40", "good", 23000, 390, "/images/products/boots5.jpg", 7),
            ("GEAR-FW-06", "Zamberlan 996 Vioz GTX Heavy Trekking", "Footwear", "Zamberlan", "44", "new", 34000, 520, "/images/products/boots6.jpg", 6),

            # Camping & Tents
            ("GEAR-TN-01", "MSR Hubba Hubba NX 2-Person 3-Season Tent", "Camping", "MSR", "One Size", "new", 44000, 750, "/images/products/tent1.jpg", 8),
            ("GEAR-TN-02", "The North Face Mountain 25 (4-Season Alpine)", "Camping", "The North Face", "One Size", "new", 58000, 950, "/images/products/tent2.jpg", 6),
            ("GEAR-TN-03", "Big Agnes Copper Spur HV UL2 Ultralight", "Camping", "Big Agnes", "One Size", "good", 42000, 700, "/images/products/tent3.jpg", 7),
            ("GEAR-TN-04", "Nemo Dagger Osmo 2P Backpacking Tent", "Camping", "Nemo", "One Size", "good", 46000, 780, "/images/products/tent4.jpg", 5),
            ("GEAR-TN-05", "Black Diamond Firstlight 2P Single-Wall", "Camping", "Black Diamond", "One Size", "new", 52000, 850, "/images/products/tent5.jpg", 4),
            ("GEAR-TN-06", "Sea to Summit Comfort Plus Insulated Mat", "Camping", "Sea to Summit", "One Size", "new", 18000, 300, "/images/products/tent6.jpg", 15),

            # Poles & Accessories
            ("GEAR-PL-01", "Black Diamond Alpine Carbon Cork Trekking Poles", "Accessories", "Black Diamond", "One Size", "new", 16000, 250, "/images/products/pole1.jpg", 20),
            ("GEAR-PL-02", "Leki Makalu FX Carbon Folding Poles", "Accessories", "Leki", "One Size", "good", 15000, 220, "/images/products/pole2.jpg", 16),
            ("GEAR-PL-03", "Black Diamond Trail Pro Shock Poles", "Accessories", "Black Diamond", "One Size", "good", 12000, 190, "/images/products/pole3.jpg", 14),
            ("GEAR-PL-04", "MSR Dynalock Ascent Carbon Poles", "Accessories", "MSR", "One Size", "new", 17000, 260, "/images/products/pole4.jpg", 10),
            ("GEAR-PL-05", "Komperdell Carbon C3 Pro Compact", "Accessories", "Komperdell", "One Size", "good", 14000, 210, "/images/products/pole5.jpg", 12),
            ("GEAR-PL-06", "Black Diamond Distance Z Trail Poles", "Accessories", "Black Diamond", "One Size", "new", 13500, 200, "/images/products/pole6.jpg", 15),

            # Headlamps & Safety
            ("GEAR-HL-01", "Petzl Actik Core 450 Rechargeable Headlamp", "Safety", "Petzl", "One Size", "new", 7500, 150, "/images/products/headlamp1.jpg", 25),
            ("GEAR-HL-02", "Black Diamond Storm 500-R Waterproof Headlamp", "Safety", "Black Diamond", "One Size", "new", 8500, 180, "/images/products/headlamp2.jpg", 20),
            ("GEAR-HL-03", "Petzl Nao+ 750 Reactive Lighting", "Safety", "Petzl", "One Size", "good", 16000, 280, "/images/products/headlamp3.jpg", 10),
            ("GEAR-HL-04", "Fenix HM65R Dual-Spot 1400 Lumen", "Safety", "Fenix", "One Size", "new", 12000, 220, "/images/products/headlamp4.jpg", 12),
            ("GEAR-HL-05", "Black Diamond Astro 300 Compact Light", "Safety", "Black Diamond", "One Size", "good", 4500, 100, "/images/products/headlamp5.jpg", 20),
            ("GEAR-HL-06", "Petzl Swift RL 900 Lumens Ultra-Bright", "Safety", "Petzl", "One Size", "new", 15000, 250, "/images/products/headlamp6.jpg", 12),

            # Cooking & Hydration
            ("GEAR-CK-01", "MSR PocketRocket 2 Ultralight Mini Stove Kit", "Cooking", "MSR", "One Size", "good", 11000, 200, "/images/products/cooking1.jpg", 15),
            ("GEAR-CK-02", "Jetboil Flash 1.0L Fast Boil Cooking System", "Cooking", "Jetboil", "One Size", "new", 14000, 280, "/images/products/cooking2.jpg", 12),
            ("GEAR-CK-03", "Katadyn BeFree 1.0L Fast Flow Water Microfilter", "Cooking", "Katadyn", "One Size", "new", 5500, 100, "/images/products/cooking3.jpg", 25),
            ("GEAR-CK-04", "Primus OmniFuel II Multi-Fuel Expedition Stove", "Cooking", "Primus", "One Size", "good", 21000, 350, "/images/products/cooking4.jpg", 8),
            ("GEAR-CK-05", "Sea to Summit Alpha Cookware 2-Pot Set", "Cooking", "Sea to Summit", "One Size", "good", 9500, 180, "/images/products/cooking5.jpg", 14),
            ("GEAR-CK-06", "Soto WindMaster High Alpine Stove with Micro", "Cooking", "Soto", "One Size", "new", 13000, 240, "/images/products/cooking6.jpg", 10),

            # Safety & First Aid
            ("GEAR-SF-01", "PeakKit High Altitude Medical & Trauma First Aid", "Safety", "PeakKit", "One Size", "new", 6500, 120, "/images/products/safety1.jpg", 30),
            ("GEAR-SF-02", "Garmin inReach Mini 2 Satellite Communicator", "Safety", "Garmin", "One Size", "new", 48000, 850, "/images/products/safety2.jpg", 8),
            ("GEAR-SF-03", "Mammut Barryvox Avalanche Transceiver 70m", "Safety", "Mammut", "One Size", "new", 42000, 750, "/images/products/safety3.jpg", 6),
            ("GEAR-SF-04", "Black Diamond Evac 7 Snow Rescue Shovel", "Safety", "Black Diamond", "One Size", "good", 9000, 160, "/images/products/safety4.jpg", 12),
            ("GEAR-SF-05", "Lifesystems Thermal Heat Reflective Bivi Sack", "Safety", "Lifesystems", "One Size", "new", 3800, 80, "/images/products/safety5.jpg", 25),
            ("GEAR-SF-06", "C.A.M.P. Stalker Universal 12-Point Crampons", "Safety", "C.A.M.P.", "One Size", "good", 16500, 280, "/images/products/safety6.jpg", 10),

            # Accessories
            ("GEAR-AC-01", "Outdoor Research Crocodile GORE-TEX Gaiters", "Accessories", "Outdoor Research", "L", "new", 8500, 140, "/images/products/accessory1.jpg", 18),
            ("GEAR-AC-02", "Nalgene 1.0L Tritan Wide-Mouth Water Bottle", "Accessories", "Nalgene", "One Size", "new", 2200, 50, "/images/products/accessory2.jpg", 35),
            ("GEAR-AC-03", "Black Diamond HeavyWeight WoolTech Gloves", "Accessories", "Black Diamond", "M", "new", 4500, 90, "/images/products/accessory3.jpg", 20),
            ("GEAR-AC-04", "Sea to Summit Ultra-Sil 30L Dry Sack", "Accessories", "Sea to Summit", "One Size", "new", 3200, 70, "/images/products/accessory4.jpg", 25),
            ("GEAR-AC-05", "Buff Original Himalayan Windproof Neckwear", "Accessories", "Buff", "One Size", "new", 2500, 60, "/images/products/accessory5.jpg", 30),
            ("GEAR-AC-06", "PeakKit 90L Expedition Waterproof Duffel", "Accessories", "PeakKit", "One Size", "good", 14500, 250, "/images/products/accessory6.jpg", 15),
        ]

        gear_map = {}
        for gid, name, cat, brand, size, cond, p_price, d_price, img, qty in GEAR_CATALOG:
            g = Gear.objects.create(
                gear_id=gid,
                name=name,
                category=cat,
                brand=brand,
                size=size,
                condition=cond,
                purchase_price=Decimal(str(p_price)),
                daily_rental_price=Decimal(str(d_price)),
                image_url=img,
                quantity_total=qty,
                quantity_available=qty,
                quantity_reserved=0,
                quantity_under_maintenance=0,
                sanitized_at=timezone.now(),
                inspection_due=timezone.now().date() + timedelta(days=90),
            )
            gear_map[gid] = g

        self.stdout.write(self.style.SUCCESS(f"✓ Seeded {len(gear_map)} catalog gear items with full inventory consistency."))

        # ==========================================
        # STEP 4: SEED REAL ADVENTURE KITS
        # ==========================================
        self.stdout.write("Assembling adventure kits from actual inventory items...")

        KITS_SPEC = [
            {
                "kit_id": "KIT-EBC-01",
                "slug": "everest-base-camp",
                "name": "Everest Base Camp Expedition Kit",
                "category": "Trekking",
                "destination": "Everest Base Camp",
                "difficulty": "Challenging",
                "duration_days": "14–16 days",
                "base_discount_percent": 22,
                "banner_image": "/images/packages/ebc-kit.jpg",
                "description": "Comprehensive high-altitude bundle engineered for the Khumbu Valley, Kala Patthar summit, and subzero teahouse nights.",
                "season": "Spring & Autumn",
                "gear_ids": ["GEAR-BP-01", "GEAR-JK-01", "GEAR-SB-01", "GEAR-PL-01", "GEAR-HL-01", "GEAR-SF-01", "GEAR-AC-01"],
            },
            {
                "kit_id": "KIT-ABC-01",
                "slug": "annapurna-base-camp",
                "name": "Annapurna Base Camp Sanctuary Kit",
                "category": "Trekking",
                "destination": "Annapurna Base Camp",
                "difficulty": "Moderate",
                "duration_days": "10–12 days",
                "base_discount_percent": 28,
                "banner_image": "/images/packages/abc-kit.jpg",
                "description": "Versatile all-weather bundle covering humid rhododendron valleys up to the frozen Annapurna Sanctuary bowl.",
                "season": "All year",
                "gear_ids": ["GEAR-BP-03", "GEAR-JK-02", "GEAR-SB-04", "GEAR-PL-02", "GEAR-HL-01", "GEAR-CK-03"],
            },
            {
                "kit_id": "KIT-MARDI-01",
                "slug": "mardi-himal",
                "name": "Mardi Himal High Ridge Kit",
                "category": "Trekking",
                "destination": "Mardi Himal",
                "difficulty": "Moderate",
                "duration_days": "5–7 days",
                "base_discount_percent": 30,
                "banner_image": "/images/packages/mardi-kit.jpg",
                "description": "Lightweight alpine setup calibrated for rapid ascents along the Mardi ridge overlooking Machapuchare.",
                "season": "All year",
                "gear_ids": ["GEAR-BP-05", "GEAR-JK-04", "GEAR-SB-04", "GEAR-PL-01", "GEAR-HL-02"],
            },
            {
                "kit_id": "KIT-LANGTANG-01",
                "slug": "langtang-valley",
                "name": "Langtang Valley & Kyanjin Ri Kit",
                "category": "Trekking",
                "destination": "Langtang Valley",
                "difficulty": "Moderate",
                "duration_days": "7–9 days",
                "base_discount_percent": 25,
                "banner_image": "/images/destinations/langtang.jpg",
                "description": "Tailored for the valley of glaciers, tamang heritage villages, and sunrise climbs up Kyanjin Ri (4,773m).",
                "season": "All year",
                "gear_ids": ["GEAR-BP-01", "GEAR-JK-02", "GEAR-SB-03", "GEAR-PL-02", "GEAR-SF-01"],
            },
            {
                "kit_id": "KIT-MANASLU-01",
                "slug": "manaslu-circuit",
                "name": "Manaslu Circuit Remote Expedition Kit",
                "category": "Trekking",
                "destination": "Manaslu Circuit",
                "difficulty": "Challenging",
                "duration_days": "14–18 days",
                "base_discount_percent": 20,
                "banner_image": "/images/destinations/manaslu.jpg",
                "description": "Heavy-duty expedition kit for the remote Larkya La Pass (5,106m) and rugged Tibetan border valleys.",
                "season": "Spring & Autumn",
                "gear_ids": ["GEAR-BP-04", "GEAR-JK-01", "GEAR-SB-01", "GEAR-TN-02", "GEAR-SF-02", "GEAR-SF-06"],
            },
            {
                "kit_id": "KIT-MUSTANG-01",
                "slug": "upper-mustang",
                "name": "Upper Mustang High Desert Kit",
                "category": "Trekking",
                "destination": "Upper Mustang",
                "difficulty": "Moderate",
                "duration_days": "10–14 days",
                "base_discount_percent": 24,
                "banner_image": "/images/destinations/upper-mustang.jpg",
                "description": "Wind-resistant, dust-sealed gear designed for the arid Himalayan rain shadow and ancient walled city of Lo Manthang.",
                "season": "Monsoon / Summer / Autumn",
                "gear_ids": ["GEAR-BP-03", "GEAR-JK-03", "GEAR-SB-04", "GEAR-PL-01", "GEAR-AC-05"],
            },
            {
                "kit_id": "KIT-GOSAIKUNDA-01",
                "slug": "gosaikunda",
                "name": "Gosaikunda Holy Lakes Trek Kit",
                "category": "Trekking",
                "destination": "Gosaikunda",
                "difficulty": "Moderate",
                "duration_days": "5–6 days",
                "base_discount_percent": 26,
                "banner_image": "/images/destinations/gosaikunda.jpg",
                "description": "Essential thermal alpine pack for the steep climb past Shin Gompa to the sacred frozen lakes of Gosaikunda (4,380m).",
                "season": "Spring / Autumn",
                "gear_ids": ["GEAR-BP-05", "GEAR-JK-02", "GEAR-SB-02", "GEAR-PL-01", "GEAR-HL-01"],
            },
            {
                "kit_id": "KIT-CAMPING-01",
                "slug": "camping-starter-kit",
                "name": "Weekend Wilderness Camping Starter Kit",
                "category": "Camping",
                "destination": "Shivapuri National Park",
                "difficulty": "Easy",
                "duration_days": "2–4 days",
                "base_discount_percent": 35,
                "banner_image": "/images/packages/camp-weekend.jpg",
                "description": "Complete self-sufficient outdoor camping setup with 2-person tent, insulated pads, cooking stove, and lanterns.",
                "season": "All year",
                "gear_ids": ["GEAR-TN-01", "GEAR-SB-04", "GEAR-TN-06", "GEAR-CK-01", "GEAR-HL-01", "GEAR-AC-02"],
            },
        ]

        for k in KITS_SPEC:
            kit = AdventureKit.objects.create(
                kit_id=k["kit_id"],
                slug=k["slug"],
                name=k["name"],
                category=k["category"],
                destination=k["destination"],
                difficulty=k["difficulty"],
                duration_days=k["duration_days"],
                base_discount_percent=k["base_discount_percent"],
                banner_image=k["banner_image"],
                description=k["description"],
                season=k["season"],
                is_active=True,
            )
            for gid in k["gear_ids"]:
                g = gear_map.get(gid)
                if g:
                    AdventureKitItem.objects.create(
                        kit=kit,
                        gear=g,
                        quantity=1,
                    )
            self.stdout.write(f"  + Adventure Kit: {kit.name} ({len(k['gear_ids'])} gear items)")

        # ==========================================
        # STEP 5: SEED REALISTIC BUSINESS ACTIVITY
        # ==========================================
        self.stdout.write("Seeding realistic multi-status demo orders and rentals...")

        # Create 10 realistic orders across customers
        today = timezone.now().date()

        ORDERS_DATA = [
            # 1. Active Rental (Maya Shrestha on Everest Base Camp)
            {
                "customer": customer_users["maya.shrestha"],
                "destination": "Everest Base Camp",
                "address": "Baluwatar, Kathmandu",
                "phone": "9841000001",
                "email": "maya.shrestha@peakkit.test",
                "start": today - timedelta(days=3),
                "end": today + timedelta(days=11),
                "items": [("GEAR-BP-01", 1), ("GEAR-JK-01", 1), ("GEAR-SB-01", 1), ("GEAR-PL-01", 1)],
                "method": "esewa",
                "order_status": "shipped",
                "partner": delivery_partners[0],
            },
            # 2. Confirmed & Packed (Aarav Koirala on Annapurna Base Camp)
            {
                "customer": customer_users["aarav.koirala"],
                "destination": "Annapurna Base Camp",
                "address": "Lakeside-6, Pokhara",
                "phone": "9841000002",
                "email": "aarav.koirala@peakkit.test",
                "start": today + timedelta(days=2),
                "end": today + timedelta(days=12),
                "items": [("GEAR-BP-03", 1), ("GEAR-JK-02", 1), ("GEAR-SB-04", 1)],
                "method": "khalti",
                "order_status": "packed",
                "partner": delivery_partners[2],
            },
            # 3. Delivered & Active on Trail (Nisha Gurung on Mardi Himal)
            {
                "customer": customer_users["nisha.gurung"],
                "destination": "Mardi Himal",
                "address": "Lazimpat, Kathmandu",
                "phone": "9841000003",
                "email": "nisha.gurung@peakkit.test",
                "start": today - timedelta(days=2),
                "end": today + timedelta(days=5),
                "items": [("GEAR-BP-05", 1), ("GEAR-JK-04", 1), ("GEAR-PL-01", 1)],
                "method": "card",
                "order_status": "delivered",
                "partner": delivery_partners[0],
            },
            # 4. Completed Historical Order (Rohan Adhikari on Langtang)
            {
                "customer": customer_users["rohan.adhikari"],
                "destination": "Langtang Valley",
                "address": "Jhamsikhel, Lalitpur",
                "phone": "9841000004",
                "email": "rohan.adhikari@peakkit.test",
                "start": today - timedelta(days=20),
                "end": today - timedelta(days=13),
                "items": [("GEAR-BP-01", 1), ("GEAR-JK-02", 1), ("GEAR-SF-01", 1)],
                "method": "card",
                "order_status": "delivered",
                "partner": delivery_partners[1],
                "is_returned": True,
            },
            # 5. Overdue / Pending Return (Elina Rai on Gosaikunda)
            {
                "customer": customer_users["elina.rai"],
                "destination": "Gosaikunda Holy Lakes",
                "address": "Sallaghari, Bhaktapur",
                "phone": "9841000005",
                "email": "elina.rai@peakkit.test",
                "start": today - timedelta(days=10),
                "end": today - timedelta(days=2),
                "items": [("GEAR-BP-05", 1), ("GEAR-JK-02", 1), ("GEAR-SB-02", 1)],
                "method": "cod",
                "order_status": "delivered",
                "partner": delivery_partners[3],
                "is_returned": False,
                "is_overdue": True,
            },
            # 6. Upcoming Confirmed Booking (Maya Shrestha on Manaslu)
            {
                "customer": customer_users["maya.shrestha"],
                "destination": "Manaslu Circuit",
                "address": "Baluwatar, Kathmandu",
                "phone": "9841000001",
                "email": "maya.shrestha@peakkit.test",
                "start": today + timedelta(days=15),
                "end": today + timedelta(days=30),
                "items": [("GEAR-BP-04", 1), ("GEAR-JK-01", 1), ("GEAR-TN-02", 1), ("GEAR-SF-06", 1)],
                "method": "bank_transfer",
                "order_status": "confirmed",
                "partner": delivery_partners[0],
            },
            # 7. Completed Weekend Camp (Aarav Koirala)
            {
                "customer": customer_users["aarav.koirala"],
                "destination": "Shivapuri Camping",
                "address": "Lakeside-6, Pokhara",
                "phone": "9841000002",
                "email": "aarav.koirala@peakkit.test",
                "start": today - timedelta(days=30),
                "end": today - timedelta(days=27),
                "items": [("GEAR-TN-01", 1), ("GEAR-SB-04", 1), ("GEAR-CK-01", 1)],
                "method": "khalti",
                "order_status": "delivered",
                "partner": delivery_partners[2],
                "is_returned": True,
            },
            # 8. Active Out for Delivery (Rohan Adhikari on Upper Mustang)
            {
                "customer": customer_users["rohan.adhikari"],
                "destination": "Upper Mustang High Desert",
                "address": "Jhamsikhel, Lalitpur",
                "phone": "9841000004",
                "email": "rohan.adhikari@peakkit.test",
                "start": today,
                "end": today + timedelta(days=10),
                "items": [("GEAR-BP-03", 1), ("GEAR-JK-03", 1), ("GEAR-AC-05", 1)],
                "method": "esewa",
                "order_status": "out_for_delivery",
                "partner": delivery_partners[1],
            },
        ]

        order_idx = 1
        for od in ORDERS_DATA:
            cust = od["customer"]
            start_date = od["start"]
            end_date = od["end"]
            days = (end_date - start_date).days

            # Calculate item daily sum
            daily_sum = sum([Decimal(str(gear_map[gid].daily_rental_price)) * qty for gid, qty in od["items"]])
            subtotal = daily_sum * Decimal(str(days))
            delivery_charge = Decimal("500.00")
            security_deposit = round(subtotal * Decimal("0.6"), 2)
            total_amount = subtotal + delivery_charge + security_deposit

            is_returned = od.get("is_returned", False)
            res_status = "Returned" if is_returned else ("Active" if od["order_status"] in ["delivered", "shipped", "out_for_delivery"] else "Upcoming")

            order = Order.objects.create(
                order_id=f"PK-2026-{order_idx:06d}",
                customer=cust,
                customer_phone=od["phone"],
                customer_email=od["email"],
                delivery_partner=od["partner"],
                destination=od["destination"],
                address=od["address"],
                payment_method=od["method"],
                payment_status="paid" if od["method"] != "cod" else "cod_pending",
                transaction_id=f"TXN-{timezone.now().strftime('%Y%m%d')}-{order_idx:06d}",
                daily_rental_price=round(daily_sum, 2),
                rental_days=days,
                rental_start_date=start_date,
                rental_end_date=end_date,
                subtotal=subtotal,
                delivery_charge=delivery_charge,
                security_deposit=security_deposit,
                total_amount=total_amount,
                order_status=od["order_status"],
                reservation_status=res_status,
                return_completed=is_returned,
                return_completed_at=timezone.now() - timedelta(days=12) if is_returned else None,
            )

            # Create OrderItems and RentalReservations, update gear capacity
            for gid, qty in od["items"]:
                g = gear_map.get(gid)
                if g:
                    OrderItem.objects.create(
                        order=order,
                        gear=g,
                        item_name=g.name,
                        quantity=qty,
                        daily_rental_price=g.daily_rental_price,
                        subtotal=g.daily_rental_price * Decimal(str(days)) * Decimal(str(qty)),
                    )

                    RentalReservation.objects.create(
                        gear=g,
                        order=order,
                        rental_start_date=start_date,
                        rental_end_date=end_date,
                        reservation_status=res_status,
                    )

                    if not is_returned:
                        g.quantity_available = max(0, g.quantity_available - qty)
                        g.quantity_reserved += qty
                        g.save()

            # Create tracking events
            TrackingEvent.objects.create(
                order=order,
                title="Reservation Confirmed",
                description=f"Verified reservation for {cust.get_full_name()} ({od['destination']})",
                icon="reservation",
                completed=True,
            )
            if order.order_status in ["packed", "shipped", "out_for_delivery", "delivered"]:
                TrackingEvent.objects.create(
                    order=order,
                    title="Gear Sanitized & Quality Checked",
                    description="Inspected by PeakKit mountain technician",
                    icon="sanitize",
                    completed=True,
                )
                TrackingEvent.objects.create(
                    order=order,
                    title="Packed At PeakKit Warehouse",
                    description="Sealed in weather-proof PeakKit transport sacks",
                    icon="pack",
                    completed=True,
                )
            if order.order_status in ["shipped", "out_for_delivery", "delivered"]:
                TrackingEvent.objects.create(
                    order=order,
                    title="Rider Assigned",
                    description=f"Assigned to {od['partner'].name} ({od['partner'].phone_number})",
                    icon="rider",
                    completed=True,
                )
                TrackingEvent.objects.create(
                    order=order,
                    title="Out For Delivery",
                    description=f"Dispatched via {od['partner'].vehicle_number}",
                    icon="delivery",
                    completed=True,
                )
            if order.order_status == "delivered":
                TrackingEvent.objects.create(
                    order=order,
                    title="Delivered to Adventurer",
                    description="Gear handed over with inspection checklist",
                    icon="delivered",
                    completed=True,
                )

            # If returned, create GearReturn inspection record
            if is_returned:
                GearReturn.objects.create(
                    order=order,
                    gear=gear_map[od["items"][0][0]],
                    condition_before="new",
                    condition_after="excellent",
                    damage_notes="Inspected by tech. Minor trail dust cleaned. Ready for re-stocking.",
                    cleaning_required=False,
                    deposit_held=security_deposit,
                    damage_fee=Decimal("0.00"),
                    refund_amount=security_deposit,
                    inspected_by=User.objects.filter(is_superuser=True).first(),
                )

            # Create in-app customer notification
            Notification.objects.create(
                user=cust,
                notification_type="reservation",
                title=f"Order #{order.order_id} Confirmed",
                message=f"Your gear reservation for {od['destination']} is booked from {start_date} to {end_date}.",
                related_order_id=order.order_id,
            )

            order_idx += 1

        self.stdout.write(self.style.SUCCESS(f"✓ Seeded {len(ORDERS_DATA)} realistic business orders and tracking lifecycles."))

        # ==========================================
        # STEP 6: SEED ANALYTICS & MARKETING EVENTS
        # ==========================================
        self.stdout.write("Seeding marketing telemetry and recommendation logs in PostgreSQL...")

        traffic_sources = ["Google Organic", "Google Organic", "Direct", "Instagram / Social", "Facebook Ads", "Travel Blogs"]
        pages = [
            ("/", "Homepage — Nepal's Premier Gear Rental"),
            ("/explore", "Explore Trekking & Camping Catalog"),
            ("/adventure-kit", "Expedition Adventure Kits Builder"),
            ("/gear-advisor", "Interactive AI Gear Advisor"),
            ("/community", "Trekker Stories & Route Reviews"),
            ("/about", "About PeakKit — Himalayan Gear Rental"),
        ]

        # 40 realistic marketing page views / funnel events
        for _ in range(40):
            p_path, _ = random.choice(pages)
            source = random.choice(traffic_sources)
            device = random.choice(["Mobile", "Mobile", "Desktop", "Tablet"])
            evt_name = random.choice(["page_view", "page_view", "view_item", "search", "add_to_cart"])
            MarketingEvent.objects.create(
                event_name=evt_name,
                session_id=f"sess_{random.randint(100000, 999999)}",
                user=random.choice(list(customer_users.values())),
                page_path=p_path,
                referrer="https://www.google.com/" if source == "Google Organic" else "",
                traffic_source=source,
                device_category=device,
                created_at=timezone.now() - timedelta(days=random.randint(0, 6), hours=random.randint(0, 23)),
            )

        # Recommendation interactions
        for gid, g in list(gear_map.items())[:8]:
            for _ in range(random.randint(5, 15)):
                RecommendationLog.objects.create(
                    rec_type=random.choice(["for_you", "similar", "trending", "kit_addons"]),
                    gear_id=gid,
                    gear_name=g.name,
                    action=random.choice(["impression", "impression", "click", "conversion"]),
                    user=random.choice(list(customer_users.values())),
                    created_at=timezone.now() - timedelta(days=random.randint(0, 5)),
                )

        self.stdout.write(self.style.SUCCESS("✓ Seeded realistic marketing events and recommendation telemetry."))
        self.stdout.write(self.style.SUCCESS("=================================================="))
        self.stdout.write(self.style.SUCCESS("🎉 PEAKKIT DATA RESET & SEEDING COMPLETED SUCCESSFULLY!"))
        self.stdout.write(self.style.SUCCESS("=================================================="))
