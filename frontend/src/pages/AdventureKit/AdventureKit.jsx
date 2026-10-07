import {
  ArrowRight,
  Check,
  ChevronLeft,
  Heart,
  Loader2,
  Mountain,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import SEO, { BASE_URL } from "../../components/common/SEO";
import { kitsAPI } from "../../services/api";

function AdventureKit() {
  const { kitName } = useParams();
  const [kits, setKits] = useState([]);
  const [selectedKit, setSelectedKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removedItemIds, setRemovedItemIds] = useState([]);

  useEffect(() => {
    setLoading(true);
    if (kitName) {
      kitsAPI
        .getBySlug(kitName)
        .then((res) => {
          setSelectedKit(res.data.kit);
        })
        .catch((err) => {
          console.error("Failed to load kit:", err);
        })
        .finally(() => setLoading(false));
    } else {
      kitsAPI
        .getAll()
        .then((res) => {
          setKits(res.data.kits || []);
        })
        .catch((err) => {
          console.error("Failed to load kits:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [kitName]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-900" />
        <p className="mt-4 text-sm text-slate-500 font-semibold">
          Loading Himalayan Adventure Kits...
        </p>
      </div>
    );
  }

  if (kitName && selectedKit) {
    return (
      <KitDetails
        kit={selectedKit}
        removedItemIds={removedItemIds}
        setRemovedItemIds={setRemovedItemIds}
      />
    );
  }

  const trekkingKits = kits.filter((k) => k.category === "Trekking");
  const otherKits = kits.filter((k) => k.category !== "Trekking");

  return (
    <main>
      <SEO
        title="Curated Adventure Kits — Expedition Gear Packages"
        description="Ready-made gear bundles curated for Everest Base Camp, Annapurna, Mardi Himal, Langtang, and camping. Save up to 35% with complete trekking packages."
        canonical="/adventure-kit"
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-green-950 px-5 py-24 text-white lg:px-8">
        <img
          src="/images/hero/hero-annapurna.jpg"
          alt="Nepal mountain trail"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          onError={(e) => (e.currentTarget.style.opacity = "0")}
        />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
            Trail Packages / Curated Gear
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold sm:text-7xl">
            Complete expedition bundles for Himalayan trails.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">
            Ready-made gear packages curated by destination, elevation, season, and terrain requirements.
          </p>
        </div>
      </section>

      <KitSection title="High-Altitude Trekking Kits" kits={trekkingKits.length ? trekkingKits : kits} />
      {otherKits.length > 0 && (
        <KitSection title="Camping & Hiking Kits" kits={otherKits} />
      )}
    </main>
  );
}

function KitSection({ title, kits }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <div className="flex items-end justify-between">
        <h2 className="font-display text-3xl font-semibold text-green-950">
          {title}
        </h2>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {kits.length} bundles ready
        </span>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kits.map((kit) => {
          const banner = kit.banner_image || `/images/packages/${kit.slug}.jpg`;
          return (
            <article
              key={kit.id || kit.slug}
              className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-emerald-800/40 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                  <img
                    src={banner}
                    alt={kit.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.opacity = "0";
                    }}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-green-950 backdrop-blur-xs">
                      {kit.difficulty}
                    </span>
                    <span className="rounded-full bg-amber-100/90 px-3 py-1 text-xs font-bold text-amber-900">
                      Save {kit.base_discount_percent}%
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-green-900">
                    {kit.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {kit.duration_days} · {kit.destination}
                  </p>
                  <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {kit.description}
                  </p>
                </div>
              </div>
              <div className="p-5 pt-0">
                <div className="mt-2 flex items-baseline justify-between border-t border-slate-100 pt-3">
                  <div>
                    <span className="text-xs text-slate-400">Bundle from</span>
                    <strong className="block text-base font-bold text-green-900">
                      NPR {kit.total_daily_price?.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ day</span>
                    </strong>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      kit.is_available ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {kit.is_available ? "In Stock" : "Limited Stock"}
                  </span>
                </div>
                <Link
                  to={`/adventure-kit/${kit.slug}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-green-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-green-800"
                >
                  <span>Explore Kit Bundle</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function KitDetails({ kit, removedItemIds, setRemovedItemIds }) {
  const navigate = useNavigate();
  const { addItem, items: cartItems } = useCart();
  const { toggleItem, isSaved } = useWishlist();

  const kitItems = kit.items || [];
  const activeItems = kitItems.filter(
    (item) => !removedItemIds.includes(item.id)
  );

  // Calculate dynamic price based on remaining constituent items
  const dynamicDailyTotal = activeItems.reduce((acc, item) => {
    const p = parseFloat(item.override_daily_price || item.daily_rental_price || 500);
    return acc + p * item.quantity;
  }, 0);

  const discountedDaily = Math.round(
    dynamicDailyTotal * (1 - (kit.base_discount_percent || 20) / 100)
  );

  const inCart = cartItems.some((i) => i.id === kit.kit_id);
  const saved = isSaved(kit.kit_id);

  useEffect(() => {
    if (!kit) return;
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      try {
        window.fbq("track", "ViewContent", {
          content_name: kit.name,
          content_ids: [kit.kit_id || kit.id || kit.slug],
          content_type: "product",
          value: discountedDaily || kit.total_daily_price || 0,
          currency: "NPR",
        });
      } catch (err) {
        console.debug("Meta Pixel ViewContent error:", err);
      }
    }
  }, [kit?.kit_id || kit?.id || kit?.slug]);

  const handleAddToCart = () => {
    addItem({
      id: kit.kit_id,
      name: kit.name,
      rentalPrice: discountedDaily,
      price: `NPR ${discountedDaily}`,
      image: kit.banner_image,
      category: "Adventure Kit",
      brand: "PeakKit",
      condition: "New",
      availability: kit.is_available ? "Available" : "Reserved",
      rating: "5.0",
      deposit: `NPR ${Math.round(discountedDaily * 2.5).toLocaleString()}`,
      duration: 1,
    });
    toast.success(
      inCart ? `${kit.name} quantity updated` : `${kit.name} added to cart!`
    );
    navigate("/cart");
  };

  const handleWishlist = () => {
    toggleItem({
      id: kit.kit_id,
      name: kit.name,
      rentalPrice: discountedDaily,
      image: kit.banner_image,
      category: "Adventure Kit",
      brand: "PeakKit",
    });
    toast.success(saved ? "Removed from wishlist" : "Saved to wishlist");
  };

  const toggleRemoveItem = (itemId) => {
    if (removedItemIds.includes(itemId)) {
      setRemovedItemIds(removedItemIds.filter((id) => id !== itemId));
    } else {
      setRemovedItemIds([...removedItemIds, itemId]);
    }
  };

  const kitSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: kit.name,
    description: kit.description,
    brand: {
      "@type": "Brand",
      name: "PeakKit",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "NPR",
      price: discountedDaily,
      availability: kit.is_available
        ? "https://schema.org/InStock"
        : "https://schema.org/LimitedAvailability",
      url: `${BASE_URL}/adventure-kit/${kit.slug}`,
    },
  };

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <SEO
        title={`${kit.name} — Adventure Rental`}
        description={`Rent complete ${kit.name} trekking gear bundle. Difficulty: ${kit.difficulty}, Duration: ${kit.duration_days}. Includes sanitized backpack, shell jacket, sleeping system & poles.`}
        canonical={`/adventure-kit/${kit.slug}`}
        schema={kitSchema}
      />
      <Link
        to="/adventure-kit"
        className="inline-flex items-center gap-2 text-sm font-semibold text-green-900"
      >
        <ChevronLeft size={16} /> All kits
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        {/* Banner */}
        <div className="aspect-[1.1] overflow-hidden rounded-[2rem] bg-stone-100">
          <img
            src={kit.banner_image}
            alt={kit.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.opacity = "0";
            }}
          />
        </div>

        {/* Details */}
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
              {kit.base_discount_percent}% Bundle Savings
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {kit.difficulty}
            </span>
          </div>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl font-semibold text-green-950">
            {kit.name}
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            {kit.duration_days} · {kit.destination} · {kit.season}
          </p>
          <p className="mt-4 text-sm text-slate-600 leading-relaxed">
            {kit.description}
          </p>

          <div className="mt-7 rounded-2xl bg-green-50/70 border border-green-900/10 p-6">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">
                  Dynamic Daily Rental ({activeItems.length} items)
                </span>
                <strong className="mt-1 block font-display text-3xl text-green-900">
                  NPR {discountedDaily.toLocaleString()} <span className="text-sm font-normal text-slate-500">/ day</span>
                </strong>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 line-through">
                  NPR {Math.round(dynamicDailyTotal).toLocaleString()}
                </span>
                <span className="block text-xs font-bold text-emerald-700">
                  Save NPR {Math.round(dynamicDailyTotal - discountedDaily).toLocaleString()} / day
                </span>
              </div>
            </div>
            <span className="mt-3 block border-t border-green-900/10 pt-3 text-xs text-green-800">
              Refundable Deposit: NPR {Math.round(discountedDaily * 2.5).toLocaleString()}
            </span>
          </div>

          <div className="mt-7 grid gap-2 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-green-700" />
              100% Sanitized & Mountain-Tested Equipment
            </span>
            <span className="flex items-center gap-2">
              <Mountain size={16} className="text-green-700" />
              Calibrated for {kit.destination || "high-altitude expeditions"}
            </span>
          </div>

          <div className="mt-7 flex gap-3">
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-2 rounded-full bg-green-900 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-green-800 shadow-md"
            >
              <ShoppingBag size={17} />
              {inCart ? "Update Cart Bundle" : "Add Bundle to Cart"}
            </button>
            <button
              onClick={handleWishlist}
              aria-label="Save kit"
              className={`grid h-12 w-12 place-items-center rounded-full border transition ${
                saved
                  ? "border-red-400 text-red-500 bg-red-50"
                  : "border-green-900 text-green-900 hover:bg-green-50"
              }`}
            >
              <Heart size={19} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>

      {/* Constituent gear items */}
      <section className="mt-20 border-t border-stone-200 pt-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold text-green-950">
              Constituent Gear in this Bundle
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Already have some of this equipment? Click to remove items and your bundle price will automatically adjust.
            </p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full shrink-0">
            {activeItems.length} of {kitItems.length} items selected
          </span>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kitItems.map((item) => {
            const isRemoved = removedItemIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`flex items-start gap-4 rounded-2xl border p-4 transition ${
                  isRemoved
                    ? "border-dashed border-slate-300 bg-stone-50 opacity-60"
                    : "border-slate-200 bg-white shadow-2xs"
                }`}
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                  <img
                    src={item.gear_image || "/images/products/backpack1.jpg"}
                    alt={item.gear_name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.opacity = "0";
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-display text-sm font-bold text-slate-900 line-clamp-1">
                    {item.gear_name}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {item.gear_category} · {item.quantity}x
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <strong className="text-xs text-green-900 font-semibold">
                      NPR {item.daily_rental_price} / day
                    </strong>
                    <button
                      onClick={() => toggleRemoveItem(item.id)}
                      className={`text-xs font-bold ${
                        isRemoved
                          ? "text-emerald-700 hover:underline"
                          : "text-slate-400 hover:text-red-600"
                      }`}
                    >
                      {isRemoved ? "+ Include back" : "− Remove from kit"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default AdventureKit;
