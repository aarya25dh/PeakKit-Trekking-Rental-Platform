import { ArrowLeft, Check, Heart, ShieldCheck, Star } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import Button from "../../components/common/Button";
import ImagePlaceholder from "../../components/common/ImagePlaceholder";
import ProductCard from "../../components/cards/ProductCard";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { products } from "../../utils/constants";

function ProductDetails() {
  const { id } = useParams();
  const product = products.find((item) => item.id === id) || products[0];
  const { addItem } = useCart();
  const { toggleItem, isSaved } = useWishlist();
  const [imgError, setImgError] = useState(false);
  const [duration, setDuration] = useState(7);

  const calculatedDeposit = Math.round((product.rentalPrice || 500) * duration * 0.6);

  const save = () => {
    toggleItem(product);
    toast.success(
      isSaved(product.id) ? "Removed from wishlist" : "Saved to wishlist"
    );
  };
  const reserve = () => {
    addItem({ ...product, duration });
    toast.success("Added to cart");
  };
  const related = products
    .filter(
      (item) => item.category === product.category && item.id !== product.id
    )
    .slice(0, 3);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <Link
        to="/explore"
        className="inline-flex items-center gap-2 text-sm font-semibold text-green-900"
      >
        <ArrowLeft size={16} /> Back to Explore
      </Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative aspect-[1.15] overflow-hidden rounded-[2rem] bg-[#e7ece7]">
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
          <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-green-900">
            {product.availability}
          </span>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            {product.brand} · {product.condition}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-green-950 sm:text-5xl">
            {product.name}
          </h1>
          <div className="mt-5 flex items-center gap-2 text-sm font-bold text-amber-600">
            <Star size={16} fill="currentColor" /> {product.rating}{" "}
            <span className="font-normal text-slate-400">
              ({product.reviewCount} reviews)
            </span>
          </div>
          <p className="mt-7 leading-7 text-slate-600">{product.description}</p>
          <div className="mt-8 flex items-end justify-between border-y border-slate-200 py-6">
            <strong className="font-display text-3xl text-green-900">
              {product.price}
              <small className="font-sans text-sm font-normal text-slate-500">
                {" "}
                / day
              </small>
            </strong>
            <span className="text-right text-sm text-slate-500">
              Security deposit (60%)
              <strong className="block text-slate-900">
                NPR {calculatedDeposit.toLocaleString()}
              </strong>
            </span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Size
              <select className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal">
                <option>{product.size}</option>
                <option>S</option>
                <option>M</option>
                <option>L</option>
                <option>XL</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Rental duration
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
              </select>
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={reserve} className="flex-1">
              Reserve
            </Button>
            <button
              onClick={save}
              aria-label="Toggle wishlist"
              className={`grid h-12 w-12 place-items-center rounded-full border border-green-900 transition ${
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
          <div className="mt-7 grid gap-3 text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-green-700" /> Sanitized and
              inspected before rental
            </span>
            <span className="flex items-center gap-2">
              <Check size={17} className="text-green-700" /> Includes rain cover
              and storage sack
            </span>
          </div>
        </div>
      </div>
      <section className="mt-20 border-t border-slate-200 pt-12">
        <h2 className="font-display text-3xl font-semibold text-green-950">
          Compatible with your route
        </h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {product.compatibleDestinations.map((destination) => (
            <span
              key={destination}
              className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-900"
            >
              {destination}
            </span>
          ))}
        </div>
        <h2 className="mt-12 font-display text-3xl font-semibold text-green-950">
          More like this
        </h2>
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </main>
  );
}

export default ProductDetails;

