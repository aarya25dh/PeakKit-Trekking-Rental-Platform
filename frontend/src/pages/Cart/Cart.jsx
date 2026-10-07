import { CalendarDays, LogIn, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "../../components/common/PageHero";
import SEO from "../../components/common/SEO";
import { HERO_IMAGES } from "../../data/imagePaths";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

function Cart() {
  const { isAuthenticated } = useAuth();
  const {
    items,
    updateQuantity,
    updateDuration,
    removeItem,
    clearCart,
    rentalSubtotal,
    deposits,
    grandTotal,
    pickupDate,
    returnDate,
    setPickupDate,
    setReturnDate,
  } = useCart();

  if (!isAuthenticated) {
    return (
      <main>
        <SEO
          title="Your Rental Cart"
          description="Review selected trekking equipment, choose rental duration and dates."
          canonical="/cart"
          noIndex={true}
        />
        <PageHero
          image={HERO_IMAGES.cartBanner}
          breadcrumb="PEAKKIT / CART"
          title="Your Trail Cart"
          subtitle="Reserve everything you need for the journey ahead."
        />
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="mx-auto max-w-md rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <ShoppingBag size={32} />
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold text-green-950">
              Please log in to view your cart.
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to access your saved rental items, choose dates, and complete your reservation.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-green-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-800 shadow-md"
              >
                <LogIn size={16} />
                Log In
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <SEO
        title="Your Rental Cart"
        description="Review selected trekking equipment, choose rental duration and dates."
        canonical="/cart"
        noIndex={true}
      />
      <PageHero
        image={HERO_IMAGES.cartBanner}
        breadcrumb="PEAKKIT / CART"
        title="Your Trail Cart"
        subtitle="Reserve everything you need for the journey ahead."
      />

      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="mb-8 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:grid-cols-2 shadow-xs">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Pickup date
            <input
              type="date"
              value={pickupDate}
              onChange={(event) => setPickupDate(event.target.value)}
              className="mt-2 block w-full rounded-2xl border border-slate-200 bg-stone-50/50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-green-800 focus:bg-white focus:ring-2 focus:ring-green-800/15"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Return date
            <input
              type="date"
              value={returnDate}
              onChange={(event) => setReturnDate(event.target.value)}
              className="mt-2 block w-full rounded-2xl border border-slate-200 bg-stone-50/50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-green-800 focus:bg-white focus:ring-2 focus:ring-green-800/15"
            />
          </label>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {items.length ? (
            <section className="space-y-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col sm:flex-row gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md"
                >
                  <div className="h-28 w-28 shrink-0 rounded-2xl bg-[#e7ece7] overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.opacity = "0";
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {item.brand}
                        </p>
                        <h2 className="mt-1 font-display text-xl font-semibold text-green-950">
                          {item.name}
                        </h2>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      NPR {item.rentalPrice} / day · Deposit {item.deposit}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <label className="text-xs font-semibold text-slate-500">
                        Duration
                        <select
                          value={item.duration}
                          onChange={(event) =>
                            updateDuration(item.id, event.target.value)
                          }
                          className="ml-2 rounded-xl border border-slate-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/10"
                        >
                          <option value="3">3 days</option>
                          <option value="7">7 days</option>
                          <option value="14">14 days</option>
                        </select>
                      </label>
                      <span className="flex items-center gap-3 rounded-full border border-slate-200 bg-stone-50 px-3 py-1 text-sm font-semibold">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          aria-label="Decrease quantity"
                          className="text-slate-500 hover:text-green-950"
                        >
                          <Minus size={13} />
                        </button>
                        {item.quantity}
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          aria-label="Increase quantity"
                          className="text-slate-500 hover:text-green-950"
                        >
                          <Plus size={13} />
                        </button>
                      </span>
                      <strong className="text-green-900 font-display text-lg">
                        NPR{" "}
                        {(
                          item.rentalPrice *
                          item.duration *
                          item.quantity
                        ).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-xs">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                <ShoppingBag size={32} />
              </div>
              <h2 className="mt-5 font-display text-2xl font-semibold text-green-950">
                Your cart is ready for a trail.
              </h2>
              <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                Add a few essentials and your rental summary will appear here.
              </p>
              <Link
                to="/explore"
                className="mt-6 inline-flex rounded-full bg-green-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-800 shadow-md"
              >
                Continue exploring
              </Link>
            </section>
          )}

          <aside className="h-fit rounded-3xl bg-green-950 p-7 text-white shadow-xl lg:sticky lg:top-24">
            <h2 className="font-display text-2xl font-semibold">
              Order summary
            </h2>
            <div className="mt-7 grid gap-4 border-b border-white/15 pb-6 text-sm text-white/65">
              <span className="flex justify-between">
                Rental subtotal{" "}
                <b className="text-white">
                  NPR {rentalSubtotal.toLocaleString()}
                </b>
              </span>
              <span className="flex justify-between">
                Security deposit{" "}
                <b className="text-white">NPR {deposits.toLocaleString()}</b>
              </span>
              <span className="flex justify-between">
                Discount <b className="text-amber-300">Coming soon</b>
              </span>
              <label className="flex items-center justify-between gap-3">
                Promo code
                <input
                  placeholder="Optional"
                  className="w-28 rounded-lg px-2 py-1 text-xs text-slate-800"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-between">
              <span>Grand total</span>
              <strong className="font-display text-2xl text-amber-300">
                NPR {grandTotal.toLocaleString()}
              </strong>
            </div>
            <Link
              to={items.length ? "/checkout" : "/explore"}
              onClick={() => {
                if (items.length > 0 && typeof window !== "undefined" && typeof window.fbq === "function") {
                  try {
                    window.fbq("track", "InitiateCheckout", {
                      content_ids: items.map((i) => i.id || i.gear_id),
                      num_items: items.length,
                      value: rentalSubtotal,
                      currency: "NPR",
                    });
                  } catch (err) {
                    console.debug("Meta Pixel InitiateCheckout error:", err);
                  }
                }
              }}
              className="mt-7 block rounded-full bg-amber-400 px-5 py-3 text-center text-sm font-bold text-green-950 transition hover:bg-amber-300"
            >
              Proceed to checkout
            </Link>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="mt-4 w-full text-sm text-white/55 hover:text-white"
              >
                Clear cart
              </button>
            )}
            <p className="mt-5 flex items-center gap-2 text-xs text-white/45">
              <CalendarDays size={15} /> Dates are saved automatically.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Cart;

