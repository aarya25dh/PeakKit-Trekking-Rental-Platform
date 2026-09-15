import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import ProductCard from "../../components/cards/ProductCard";
import PageHero from "../../components/common/PageHero";
import { HERO_IMAGES } from "../../data/imagePaths";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

function Wishlist() {
  const { items, removeItem, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const savings = items.reduce((sum, item) => sum + item.rentalPrice * 3, 0);

  const handleMoveToCart = (item) => {
    addItem(item);
    removeItem(item.id);
    toast.success(`${item.name} moved to cart`);
  };

  const handleMoveAllToCart = () => {
    items.forEach((item) => addItem(item));
    clearWishlist();
    toast.success("All items moved to cart");
  };

  return (
    <main>
      <PageHero
        image={HERO_IMAGES.wishlistMountains}
        breadcrumb="PEAKKIT / WISHLIST"
        title="Your Saved Gear"
        subtitle="Keep your favourite trekking gear in one place and reserve it whenever you're ready."
      />
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold text-green-950">
              Your saved gear
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {items.length} saved products · Estimated three-day rental savings:{" "}
              <strong className="text-green-800">
                NPR {savings.toLocaleString()}
              </strong>
            </p>
          </div>
          {items.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleMoveAllToCart}
                className="flex items-center gap-2 rounded-full bg-green-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-800"
              >
                <ShoppingBag size={15} /> Move all to cart
              </button>
              <button
                onClick={clearWishlist}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:bg-stone-50"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
        {items.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="relative">
                <ProductCard product={item} />
                {/* Per-item action buttons overlaid at the bottom of the card */}
                <div className="absolute bottom-[68px] right-4 flex gap-1.5">
                  <button
                    onClick={() => handleMoveToCart(item)}
                    aria-label={`Add ${item.name} to cart`}
                    className="flex items-center gap-1 rounded-full bg-green-900 px-3 py-1.5 text-[11px] font-bold text-white shadow hover:bg-green-800 transition"
                  >
                    <ShoppingBag size={12} /> Add to cart
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="rounded-full bg-white p-1.5 text-slate-400 shadow hover:text-red-600 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
            <Heart className="mx-auto text-amber-500" size={34} />
            <h2 className="mt-5 font-display text-2xl font-semibold">
              Nothing saved yet.
            </h2>
            <p className="mt-2 text-slate-500">
              Tap the heart on any product to build your next kit.
            </p>
            <Link
              to="/explore"
              className="mt-6 inline-flex rounded-full bg-green-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800"
            >
              Explore gear
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default Wishlist;
