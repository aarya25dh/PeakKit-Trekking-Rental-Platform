import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import PageHero from "../../components/common/PageHero";
import SEO from "../../components/common/SEO";
import { OrderCardSkeleton } from "../../components/common/Skeleton";
import { HERO_IMAGES } from "../../data/imagePaths";
import { ordersAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-900 border-amber-200",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-emerald-100 text-emerald-900 border-emerald-200",
    icon: CheckCircle2,
  },
  packed: {
    label: "Packed",
    color: "bg-blue-100 text-blue-900 border-blue-200",
    icon: Package,
  },
  shipped: {
    label: "Shipped",
    color: "bg-purple-100 text-purple-900 border-purple-200",
    icon: Truck,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "bg-orange-100 text-orange-900 border-orange-200",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-900 border-green-200",
    icon: ShieldCheck,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-rose-100 text-rose-900 border-rose-200",
    icon: XCircle,
  },
};

function Rentals() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchOrders = async () => {
    if (!isAuthenticated && !localStorage.getItem("access_token")) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await ordersAPI.getAll();
      const rawOrders = res.data?.orders || [];
      // Sort newest first
      const sorted = [...rawOrders].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setOrders(sorted);
    } catch (err) {
      console.error("Failed to fetch order history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnOrder = async (orderId) => {
    try {
      await ordersAPI.returnOrder(orderId, "good");
      toast.success(`Order ${orderId} return submitted! Deposit refund processing.`);
      fetchOrders();
    } catch {
      toast.error("Could not process gear return.");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [location.state?.newOrderId, isAuthenticated]);

  return (
    <main className="bg-[#f9fafb] pb-24">
      <SEO
        title="Your Trail Gear Rentals & Expedition Orders"
        description="View your active and completed trekking equipment rentals, delivery tracking, and returns."
        canonical="/rentals"
        noIndex={false}
      />
      <PageHero
        image={HERO_IMAGES.langtang}
        breadcrumb="TRAIL / ORDER HISTORY"
        title="Your Trail Reservations"
        subtitle="Manage active equipment rentals, track deliveries, and view completed mountain expeditions."
      />

      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <OrderCardSkeleton key={n} />
            ))}
          </div>
        ) : !isAuthenticated && !localStorage.getItem("access_token") ? (
          <div className="rounded-[2.5rem] border border-dashed border-amber-300 bg-amber-50/60 p-12 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-800">
              <Compass size={32} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-green-950">
              Sign In to View Your Reservations
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              Please sign in to access your booked expeditions, active gear rentals, and live order tracking.
            </p>
            <Link
              to="/login?redirect=/rentals"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-800 shadow-sm"
            >
              Sign In to Account
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[2.5rem] border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-700">
              <Compass size={32} />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-green-950">
              No active gear reservations found
            </h2>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              You haven&apos;t reserved any expedition kits yet. Explore our gear
              catalog to gear up for your next adventure in Nepal.
            </p>
            <Link
              to="/explore"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-800"
            >
              Explore Trekking Gear
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-green-950">
                All Expeditions & Rentals ({orders.length})
              </h2>
              <button
                type="button"
                onClick={fetchOrders}
                className="text-xs font-bold text-emerald-800 hover:underline"
              >
                ↻ Refresh Orders
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {orders.map((order) => {
                const statusInfo =
                  statusConfig[order.order_status] || statusConfig.pending;
                const StatusIcon = statusInfo.icon;
                const isNew = location.state?.newOrderId === order.order_id;

                return (
                  <article
                    key={order.order_id || order.id}
                    className={`relative flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-sm transition hover:shadow-md ${
                      isNew
                        ? "border-emerald-500 ring-2 ring-emerald-500/20"
                        : "border-slate-200"
                    }`}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-400">
                            {order.order_id}
                          </span>
                          <h3 className="mt-0.5 font-display text-xl font-bold text-green-950">
                            {order.destination || "Himalayan Expedition Kit"}
                          </h3>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-xs ${statusInfo.color}`}
                        >
                          <StatusIcon size={14} />
                          <span>{statusInfo.label}</span>
                        </span>
                      </div>

                      {/* Details Grid */}
                      <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl bg-stone-50/80 p-4 text-xs">
                        <div>
                          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                            Total Amount
                          </span>
                          <p className="mt-0.5 font-bold text-green-950 text-sm">
                            NPR{" "}
                            {Number(
                              order.total_amount || order.subtotal || 0
                            ).toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                            Payment Status
                          </span>
                          <p className="mt-0.5 font-bold capitalize text-slate-700 text-sm">
                            {order.payment_status?.replace("_", " ") || "Paid"}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                            Booked On
                          </span>
                          <p className="mt-0.5 font-medium text-slate-600">
                            {new Date(order.created_at).toLocaleDateString([], {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                            Rental Period
                          </span>
                          <p className="mt-0.5 font-bold text-slate-700 text-xs truncate">
                            {order.rental_start_date && order.rental_end_date
                              ? `${order.rental_start_date} → ${order.rental_end_date} (${order.rental_days || 7}d)`
                              : `${order.rental_days || 7} Days`}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                            Reservation Status
                          </span>
                          <p className="mt-0.5 font-bold text-emerald-800 text-xs">
                            {order.reservation_status || "Active"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" />
                        <span>Nepal Trails</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {order.reservation_status !== "Returned" && order.order_status !== "cancelled" && (
                          <button
                            type="button"
                            onClick={() => handleReturnOrder(order.order_id)}
                            className="rounded-full border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-50"
                          >
                            Return Gear
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/tracking/${order.order_id}`)}
                          className="inline-flex items-center gap-2 rounded-full bg-green-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-green-800"
                        >
                          <Truck size={14} />
                          <span>Track Order</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default Rentals;
