import {
  ArrowLeft,
  Check,
  Heart,
  ShieldCheck,
  Star,
  Sparkles,
  Plus,
  Users,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Button from "../../components/common/Button";
import ImagePlaceholder from "../../components/common/ImagePlaceholder";
import ProductCard from "../../components/cards/ProductCard";
import SEO, { BASE_URL } from "../../components/common/SEO";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { gearAPI, recommendationsAPI } from "../../services/api";
import { analytics } from "../../services/analytics";
import { products as staticProducts } from "../../utils/constants";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { toggleItem, isSaved } = useWishlist();
  const [imgError, setImgError] = useState(false);
  const [duration, setDuration] = useState(7);
  const [addons, setAddons] = useState([]);
  const [similarRecs, setSimilarRecs] = useState([]);
  const [coRentedRecs, setCoRentedRecs] = useState([]);

  useEffect(() => {
    setLoading(true);
    setImgError(false);

    gearAPI
      .getById(id)
      .then((res) => {
        if (res.data?.gear) {
          const g = res.data.gear;
          const normalized = {
            id: g.gear_id || g.id,
            gear_id: g.gear_id,
            sku: g.sku,
            name: g.name,
            category: g.category || "Trekking Gear",
            brand: g.brand || "PeakKit",
            rentalPrice: parseFloat(g.daily_rental_price || g.rental_price_per_day || 500),
            price: `NPR ${Math.round(parseFloat(g.daily_rental_price || g.rental_price_per_day || 500))}`,
            condition: g.condition || "good",
            availability: g.quantity_available > 0 ? "Available" : "Reserved",
            size: g.size || "M",
            rating: "4.9",
            reviewCount: 24,
            deposit: `NPR ${Math.round(parseFloat(g.daily_rental_price || 500) * 2.5)}`,
            image: g.image_url || "/images/products/backpack1.jpg",
            description: `Engineered for high Himalayan passes, rugged ridges, and alpine base camps. Sanitized and safety-verified by PeakKit gear technicians.`,
            compatibleDestinations: ["Everest Base Camp", "Annapurna Base Camp", "Langtang", "Mardi Himal"],
          };
          setProduct(normalized);
          analytics.trackViewItem(normalized);
        } else {
          fallbackToStatic();
        }
      })
      .catch(() => {
        fallbackToStatic();
      })
      .finally(() => setLoading(false));

    function fallbackToStatic() {
      const match = staticProducts.find((item) => item.id === id) || staticProducts[0];
      setProduct(match);
      analytics.trackViewItem(match);
    }
  }, [id]);

  useEffect(() => {
    if (!product) return;
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      try {
        window.fbq("track", "ViewContent", {
          content_name: product.name,
          content_ids: [product.id || product.gear_id],
          content_type: "product",
          value: product.rentalPrice || 500,
          currency: "NPR",
        });
      } catch (err) {
        console.debug("Meta Pixel ViewContent error:", err);
      }
    }
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;

    const loadRecommendations = async () => {
      try {
        const dest = product.compatibleDestinations?.[0] || "Annapurna";
        const [addonsRes, similarRes, coRentedRes] = await Promise.all([
          recommendationsAPI.getKitAddons(dest, 3),
          recommendationsAPI.getSimilar(product.gear_id || product.id, 3),
          recommendationsAPI.getCustomersAlsoRented(product.gear_id || product.id, 3),
        ]);
        setAddons(addonsRes.data?.recommendations || []);
        setSimilarRecs(similarRes.data?.recommendations || []);
        setCoRentedRecs(coRentedRes.data?.recommendations || []);
      } catch (e) {
        console.debug("Recommendations load error:", e);
      }
    };
    loadRecommendations();
  }, [product]);

  if (loading || !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-900" />
        <p className="mt-3 text-sm text-slate-500 font-semibold">
          Loading gear specifications...
        </p>
      </div>
    );
  }

  const calculatedDeposit = Math.round((product.rentalPrice || 500) * duration * 0.6);

  const save = () => {
    toggleItem(product);
    toast.success(
      isSaved(product.id) ? "Removed from wishlist" : "Saved to wishlist"
    );
  };

  const reserveNow = () => {
    addItem({ ...product, duration });
    toast.success("Proceeding to checkout reservation...");
    navigate("/checkout");
  };

  const addToCartOnly = () => {
    addItem({ ...product, duration });
    toast.success(`${product.name} added to cart`);
  };

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: product.image ? (product.image.startsWith("http") ? product.image : `${BASE_URL}${product.image}`) : undefined,
    description: product.description || `Rent ${product.name} for your Nepal trekking adventure.`,
    brand: {
      "@type": "Brand",
      name: product.brand || "PeakKit",
    },
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/product/${product.id}`,
      priceCurrency: "NPR",
      price: product.rentalPrice || 500,
      availability: "https://schema.org/InStock",
      priceValidUntil: "2027-12-31",
    },
  };

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <SEO
        title={`${product.name} — Rent Trekking Gear`}
        description={`Rent ${product.name} by ${product.brand} in Nepal. Daily rate: NPR ${product.rentalPrice}/day. Verified sanitized condition with full deposit protection.`}
        canonical={`/product/${product.id}`}
        image={product.image || undefined}
        schema={productSchema}
      />
      <Link
        to="/explore"
        className="inline-flex items-center gap-2 text-sm font-semibold text-green-900 hover:underline"
      >
        <ArrowLeft size={16} /> Back to Explore
      </Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative aspect-[1.15] overflow-hidden rounded-[2rem] bg-stone-100">
          {imgError || !product.image ? (
            <ImagePlaceholder
              aspectRatio="aspect-[1.15]"
              text="Image Coming Soon"
              subtext={product.name}
            />
          ) : (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          )}
          <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-bold text-green-900 shadow-sm backdrop-blur-xs">
            {product.availability || "Available"}
          </span>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
            {product.brand} · {product.condition} condition
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-green-950 sm:text-5xl">
            {product.name}
          </h1>
          <div className="mt-4 flex items-center gap-2 text-sm font-bold text-amber-600">
            <Star size={16} fill="currentColor" /> {product.rating}{" "}
            <span className="font-normal text-slate-400">
              ({product.reviewCount || 24} reviews)
            </span>
          </div>
          <p className="mt-6 leading-7 text-slate-600">{product.description}</p>
          <div className="mt-8 flex items-end justify-between border-y border-slate-200 py-6">
            <div>
              <span className="text-xs text-slate-400">Rental Rate</span>
              <strong className="block font-display text-3xl text-green-900 mt-0.5">
                {product.price}
                <small className="font-sans text-sm font-normal text-slate-500">
                  {" "}
                  / day
                </small>
              </strong>
            </div>
            <span className="text-right text-xs text-slate-500">
              Security Deposit (Refundable)
              <strong className="block text-sm text-slate-900 font-bold mt-0.5">
                NPR {calculatedDeposit.toLocaleString()}
              </strong>
            </span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Size
              <select className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-stone-50/50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-green-800 focus:bg-white focus:ring-2 focus:ring-green-800/15">
                <option>{product.size || "M"}</option>
                <option>S</option>
                <option>M</option>
                <option>L</option>
                <option>XL</option>
              </select>
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Rental Duration
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-stone-50/50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-green-800 focus:bg-white focus:ring-2 focus:ring-green-800/15"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days (Standard)</option>
                <option value={14}>14 days (High Trek)</option>
                <option value={21}>21 days (Circuit Expedition)</option>
              </select>
            </label>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={reserveNow} className="flex-1 bg-green-900 text-white hover:bg-green-800">
              Reserve & Book Now
            </Button>
            <Button onClick={addToCartOnly} variant="outline" className="border-green-900 text-green-900 hover:bg-green-50">
              Add to Cart
            </Button>
            <button
              onClick={save}
              aria-label="Toggle wishlist"
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border border-green-900 transition ${
                isSaved(product.id)
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "text-green-900 hover:bg-green-50"
              }`}
            >
              <Heart
                size={19}
                fill={isSaved(product.id) ? "currentColor" : "none"}
              />
            </button>
          </div>
          <div className="mt-7 grid gap-2.5 text-xs text-slate-600">
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-green-700" /> Sanitized and
              inspected by gear specialists before dispatch
            </span>
            <span className="flex items-center gap-2">
              <Check size={16} className="text-green-700" /> Includes weatherproof
              storage sack & trail instructions
            </span>
          </div>
        </div>
      </div>

      {/* Compatible Destinations */}
      <section className="mt-20 border-t border-slate-200 pt-12">
        <h2 className="font-display text-2xl font-bold text-green-950">
          Compatible with Himalayan Routes
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {(product.compatibleDestinations || ["Everest Region", "Annapurna", "Langtang", "Mardi"]).map((dest) => (
            <span
              key={dest}
              className="rounded-full bg-green-50 border border-green-200/80 px-4 py-2 text-xs font-bold text-green-900"
            >
              🏔️ {dest}
            </span>
          ))}
        </div>

        {/* Frequently Rented Together (Add-ons) */}
        {addons.length > 0 && (
          <div className="mt-14 rounded-3xl border border-stone-200/80 bg-stone-50/70 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
              <Sparkles size={15} />
              <span>Frequently Rented Together</span>
            </div>
            <h3 className="mt-1 font-display text-2xl font-bold text-green-950">
              Essential Add-Ons For This Trek
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Trekkers renting the {product.name} also pack these trail accessories.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {addons.map((addon) => (
                <div
                  key={addon.id || addon.gear_id}
                  className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {addon.brand}
                    </span>
                    <h4 className="font-display font-semibold text-green-950 text-sm mt-0.5">
                      {addon.name}
                    </h4>
                    <p className="text-xs text-emerald-800 font-bold mt-1">
                      {addon.price} / day
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      addItem({ ...addon, duration: 7 });
                      toast.success(`Added ${addon.name} to cart`);
                      analytics.trackRecommendationClick("frequently_together", addon);
                    }}
                    className="mt-4 inline-flex items-center justify-center gap-1 rounded-full bg-green-900 py-2 text-xs font-bold text-white hover:bg-green-800 transition"
                  >
                    <Plus size={14} /> Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customers Also Rented (Collaborative Filtering) */}
        {coRentedRecs.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <Users size={15} />
              <span>Collaborative Expedition Insights</span>
            </div>
            <h3 className="mt-1 font-display text-2xl font-bold text-green-950">
              Customers Also Rented
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Popular gear combinations chosen by high-altitude trekkers.
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {coRentedRecs.map((item) => (
                <ProductCard key={item.id || item.gear_id} product={item} />
              ))}
            </div>
          </div>
        )}

        {/* Similar Gear (Content-Based) */}
        {similarRecs.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl font-bold text-green-950">
                  Similar High-Altitude Gear
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Content-matched alternatives in {product.category}
                </p>
              </div>
              <Link
                to="/explore"
                className="text-xs font-bold text-emerald-800 hover:underline"
              >
                View all {product.category} →
              </Link>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {similarRecs.map((item) => (
                <ProductCard key={item.id || item.gear_id} product={item} />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default ProductDetails;
