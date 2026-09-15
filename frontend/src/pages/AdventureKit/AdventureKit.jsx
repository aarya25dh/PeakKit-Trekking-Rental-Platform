import {
  ArrowRight,
  Check,
  ChevronLeft,
  Heart,
  Mountain,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

const trekKits = [
  ["Everest Base Camp", "Challenging", "14–16 days", "NPR 12,500", "22%", "everest.jpg"],
  ["Annapurna Base Camp", "Moderate", "10–12 days", "NPR 8,900", "28%", "annapurna.jpg"],
  ["Mardi Himal", "Moderate", "5–7 days", "NPR 5,600", "35%", "mardi.jpg"],
  ["Langtang Valley", "Moderate", "7–9 days", "NPR 6,800", "31%", "langtang.jpg"],
  ["Gosaikunda", "Moderate", "5–7 days", "NPR 5,200", "38%", "gosaikunda.jpg"],
  ["Ama Yangri", "Easy", "2–3 days", "NPR 2,400", "42%", "ama-yangri.jpg"],
  ["Upper Mustang", "Challenging", "12–14 days", "NPR 11,800", "24%", "upper-mustang.jpg"],
  ["Manaslu Circuit", "Challenging", "16–18 days", "NPR 14,500", "20%", "manaslu.jpg"],
];

const otherKits = [
  ["Shivapuri Hike", "Easy", "1 day", "NPR 1,200", "hike-shivapuri.jpg"],
  ["Nagarkot Sunrise", "Easy", "1 day", "NPR 900", "hike-nagarkot.jpg"],
  ["Champadevi", "Easy", "1 day", "NPR 850", "hike-champadevi.jpg"],
  ["Phulchowki", "Moderate", "1 day", "NPR 1,400", "hike-phulchowki.jpg"],
  ["Weekend Camping", "Easy", "2 days", "NPR 3,800", "camp-weekend.jpg"],
  ["Family Camping", "Easy", "2 days", "NPR 5,600", "camp-family.jpg"],
  ["Solo Camping", "Moderate", "2 days", "NPR 3,200", "camp-solo.jpg"],
  ["Luxury Camping", "Easy", "2 days", "NPR 8,500", "camp-luxury.jpg"],
];

const included = [
  "45L trekking backpack",
  "Weatherproof shell jacket",
  "Warm sleeping system",
  "Trekking poles",
  "Headlamp",
  "First aid essentials",
  "Rain cover",
  "Water filter",
];

/** Parse "NPR 12,500" → 12500 */
function parsePrice(priceStr) {
  return parseInt(priceStr.replace(/[^0-9]/g, ""), 10) || 0;
}

function AdventureKit() {
  const { kitName } = useParams();
  const selected = trekKits.find(
    (kit) => kit[0].toLowerCase().replaceAll(" ", "-") === kitName
  );
  const [removed, setRemoved] = useState([]);

  if (selected)
    return <KitDetails kit={selected} removed={removed} setRemoved={setRemoved} />;

  return (
    <main>
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
            PeakKit / Curated gear
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold sm:text-7xl">
            Adventure kits for every trail in Nepal.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">
            Ready-made gear bundles curated by destination, season, and the way
            you like to travel.
          </p>
        </div>
      </section>

      <KitSection title="Trekking kits" kits={trekKits} trek />
      <KitSection title="Hiking kits" kits={otherKits.slice(0, 4)} />
      <KitSection title="Camping kits" kits={otherKits.slice(4)} />
    </main>
  );
}

function KitSection({ title, kits, trek }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <h2 className="font-display text-3xl font-semibold text-green-950">{title}</h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kits.map((kit) => (
          <article
            key={kit[0]}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="aspect-[1.1] bg-[#315843]">
              <img
                src={`/images/${trek ? "destinations" : "packages"}/${kit[5] || kit[4]}`}
                alt={kit[0]}
                loading="lazy"
                onError={(e) => (e.currentTarget.style.opacity = "0")}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-5">
              <h3 className="font-display text-xl font-semibold">{kit[0]}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {kit[1]} · {kit[2]}
              </p>
              <strong className="mt-4 block text-green-900">{kit[3]}</strong>
              <p className="mt-1 text-xs text-green-700">
                Save {kit[4] || "20%"} vs buying
              </p>
              <Link
                to={`/adventure-kit/${kit[0].toLowerCase().replaceAll(" ", "-")}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-green-900"
              >
                View kit <ArrowRight size={15} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function KitDetails({ kit, removed, setRemoved }) {
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const { toggleItem, isSaved } = useWishlist();

  const visible = included.filter((item) => !removed.includes(item));

  // Build cart item from kit data
  const kitId = `kit-${kit[0].toLowerCase().replaceAll(" ", "-")}`;
  const rentalPrice = parsePrice(kit[3]);
  const inCart = items.some((i) => i.id === kitId);
  const saved = isSaved(kitId);

  const handleAddToCart = () => {
    addItem({
      id: kitId,
      name: `${kit[0]} Adventure Kit`,
      rentalPrice,
      image: `/images/destinations/${kit[5]}`,
      category: "Adventure Kit",
      brand: "PeakKit",
      condition: "New",
      availability: "Available",
      rating: "5.0",
      deposit: `NPR ${Math.round(rentalPrice * 0.6).toLocaleString()}`,
      duration: 1,
    });
    toast.success(
      inCart
        ? `${kit[0]} kit quantity updated`
        : `${kit[0]} kit added to cart!`
    );
    navigate("/cart");
  };

  const handleWishlist = () => {
    toggleItem({
      id: kitId,
      name: `${kit[0]} Adventure Kit`,
      rentalPrice,
      image: `/images/destinations/${kit[5]}`,
      category: "Adventure Kit",
      brand: "PeakKit",
      condition: "New",
      availability: "Available",
      rating: "5.0",
      deposit: `NPR ${Math.round(rentalPrice * 0.6).toLocaleString()}`,
    });
    toast.success(saved ? "Removed from wishlist" : "Saved to wishlist");
  };

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <Link
        to="/adventure-kit"
        className="inline-flex items-center gap-2 text-sm font-semibold text-green-900"
      >
        <ChevronLeft size={16} /> All kits
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        {/* Image */}
        <div className="aspect-[1.1] overflow-hidden rounded-[2rem] bg-[#315843]">
          <img
            src={`/images/destinations/${kit[5]}`}
            alt={kit[0]}
            className="h-full w-full object-cover"
            onError={(e) => (e.currentTarget.style.opacity = "0")}
          />
        </div>

        {/* Details */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            Curated for the route
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-green-950">
            {kit[0]} Kit
          </h1>
          <p className="mt-4 text-lg text-slate-500">
            {kit[1]} · {kit[2]} · {kit[4]} savings
          </p>

          <div className="mt-7 rounded-2xl bg-green-50 p-6">
            <span className="text-sm text-slate-500">Rental total</span>
            <strong className="mt-1 block font-display text-4xl text-green-900">
              {kit[3]}
            </strong>
            <span className="mt-1 block text-sm text-green-700">
              Deposit: NPR {Math.round(rentalPrice * 0.6).toLocaleString()}
            </span>
          </div>

          <div className="mt-7 grid gap-3 text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-green-700" />
              Weather-compatible for {kit[0]}
            </span>
            <span className="flex items-center gap-2">
              <Mountain size={17} className="text-green-700" />
              Sizes S–XL available
            </span>
          </div>

          <div className="mt-7 flex gap-3">
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-2 rounded-full bg-green-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800"
            >
              <ShoppingBag size={16} />
              {inCart ? "Update cart" : "Add entire kit to cart"}
            </button>
            <button
              onClick={handleWishlist}
              aria-label="Save kit"
              className={`grid h-12 w-12 place-items-center rounded-full border transition ${
                saved
                  ? "border-red-400 text-red-500"
                  : "border-green-900 text-green-900 hover:bg-green-50"
              }`}
            >
              <Heart size={19} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>

      {/* Included items */}
      <section className="mt-20">
        <h2 className="font-display text-3xl font-semibold text-green-950">
          Everything included
        </h2>
        <p className="mt-3 text-slate-500">
          Remove any item you already own and we will recalculate your kit.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((item) => (
            <div
              key={item}
              className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <span className="flex gap-2 text-sm font-semibold">
                <Check size={16} className="mt-0.5 text-green-700" />
                {item}
              </span>
              <button
                onClick={() => setRemoved([...removed, item])}
                className="text-xs text-slate-400 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default AdventureKit;
