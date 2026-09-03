import { Heart, Star } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import ImagePlaceholder from "../common/ImagePlaceholder";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

function ProductCard({ product }) {
  const { addItem, items } = useCart();
  const navigate = useNavigate();
  const { toggleItem, isSaved } = useWishlist();
  const [imgError, setImgError] = useState(false);

  const saved = isSaved(product.id);
  const inCart = items.some((item) => item.id === product.id);

  const reserve = () => {
    addItem(product);
    toast.success(
      `${product.name} ${inCart ? "quantity updated" : "added to cart"}`
    );
  };
  const rentNow = () => {
    addItem(product);
    toast.success("Added to cart");
    navigate("/checkout");
  };
  const save = () => {
    toggleItem(product);
    toast.success(saved ? "Removed from wishlist" : "Saved to wishlist");
  };

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {imgError || !product.image ? (
          <ImagePlaceholder aspectRatio="aspect-[4/3]" text="Image Coming Soon" subtext={product.name} />
        ) : (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        )}
        <div className="absolute left-4 top-4 flex gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              product.availability === "Reserved"
                ? "bg-amber-100 text-amber-900"
                : "bg-white/90 text-green-900"
            }`}
          >
            {product.availability || "Available"}
          </span>
          <span className="hidden rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 sm:inline">
            {product.condition}
          </span>
        </div>
        <button
          onClick={save}
          aria-label={`Save ${product.name}`}
          className={`absolute right-4 top-4 rounded-full bg-white p-2 shadow-sm ${
            saved ? "text-red-600" : "text-slate-700 hover:text-red-600"
          }`}
        >
          <Heart size={17} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-amber-600">
          <Star size={14} fill="currentColor" /> {product.rating}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {product.brand}
        </p>
        <Link to={`/product/${product.id}`}>
          <h3 className="mt-1 font-display text-lg font-semibold text-slate-900 hover:text-green-800">
            {product.name}
          </h3>
        </Link>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">
              from{" "}
              <strong className="text-base text-green-900">
                {product.price || `NPR ${product.rentalPrice}`}
              </strong>{" "}
              / day
            </p>
            <p className="mt-0.5 text-xs text-slate-400 font-medium">
              Deposit: <span className="text-slate-600 font-semibold">{product.deposit}</span>
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            onClick={rentNow}
            className="flex-1 rounded-full bg-green-900 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-green-800"
          >
            Rent now
          </button>
          <button
            onClick={reserve}
            className="rounded-full border border-green-900 px-3 py-2 text-xs font-semibold text-green-900 transition hover:bg-green-50"
          >
            Reserve
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;

