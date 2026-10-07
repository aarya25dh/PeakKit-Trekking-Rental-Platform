import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Compass,
  CreditCard,
  FileText,
  MapPin,
  ShoppingBag,
  Truck,
} from "lucide-react";
import PageHero from "../../components/common/PageHero";
import OrderTimeline from "../../components/payments/OrderTimeline";
import DeliveryPartnerCard from "../../components/payments/DeliveryPartnerCard";
import SEO from "../../components/common/SEO";
import { HERO_IMAGES } from "../../data/imagePaths";
import { ordersAPI } from "../../services/api";

function TrackingPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const res = await ordersAPI.getById(orderId);
      if (res.data?.order) {
        setOrder(res.data.order);
      }
    } catch (err) {
      console.error("Failed to fetch order details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Auto-refresh every 20 seconds
    const interval = setInterval(fetchOrder, 20000);
    return () => clearInterval(interval);
  }, [orderId]);

  return (
    <main className="bg-[#f9fafb] pb-24">
      <SEO
        title={`Tracking Order ${orderId || ""}`}
        description="Live expedition gear delivery tracking."
        canonical={`/tracking/${orderId || ""}`}
        noIndex={true}
      />
      <PageHero
        image={HERO_IMAGES.checkoutBanner}
        breadcrumb="PEAKKIT / LIVE TRACKING"
        title="Live Expedition Tracking"
        subtitle={`Order Reference: ${orderId} · Tracking dispatched equipment & logistics in real-time.`}
        primaryButton={{
          text: "← Back to Order History",
          onClick: () => window.history.back(),
        }}
      />

      <div className="mx-auto max-w-5xl px-5 py-12 lg:px-8 space-y-10">
        {loading && !order ? (
          <div className="space-y-6">
            <div className="h-44 animate-pulse rounded-3xl border border-slate-200 bg-white" />
            <div className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          </div>
        ) : order ? (
          <>
            {/* Quick Overview Summary Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Expedition Destination
                  </span>
                  <h3 className="font-display text-2xl font-bold text-green-950 flex items-center gap-2">
                    <MapPin size={22} className="text-emerald-700" />
                    <span>{order.destination || "Himalayan Route"}</span>
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Delivery Address: {order.address}{" "}
                    {order.landmark ? `(${order.landmark})` : ""}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Total Amount
                  </span>
                  <p className="font-display text-2xl font-bold text-green-950">
                    NPR {Number(order.total_amount || 0).toLocaleString()}
                  </p>
                  <span className="text-xs font-semibold capitalize text-emerald-800">
                    {order.payment_method?.replace("_", " ")} · {order.payment_status}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="rounded-2xl bg-stone-50 p-3">
                  <span className="text-slate-400 text-[10px] font-bold uppercase">
                    Customer
                  </span>
                  <p className="font-bold text-green-950 mt-0.5 truncate">
                    {order.customer_name || "Aarya Dhungana"}
                  </p>
                </div>

                <div className="rounded-2xl bg-stone-50 p-3">
                  <span className="text-slate-400 text-[10px] font-bold uppercase">
                    Phone
                  </span>
                  <p className="font-bold text-slate-700 mt-0.5">
                    {order.customer_phone || "9860467948"}
                  </p>
                </div>

                <div className="rounded-2xl bg-stone-50 p-3">
                  <span className="text-slate-400 text-[10px] font-bold uppercase">
                    Status
                  </span>
                  <p className="font-bold capitalize text-emerald-900 mt-0.5">
                    {order.order_status?.replace("_", " ")}
                  </p>
                </div>

                <div className="rounded-2xl bg-stone-50 p-3">
                  <span className="text-slate-400 text-[10px] font-bold uppercase">
                    Estimated Delivery
                  </span>
                  <p className="font-bold text-slate-700 mt-0.5">
                    {order.estimated_delivery
                      ? new Date(order.estimated_delivery).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })
                      : "Within 24 Hours"}
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Partner Assigned Card */}
            <DeliveryPartnerCard
              partner={order.delivery_partner}
              trackingId={`PKDLV-${order.order_id?.replace(/[^0-9]/g, "") || "48393"}`}
            />

            {/* Live Shipping & Gear Prep Timeline */}
            <OrderTimeline orderId={orderId} initialOrder={order} />

            {/* Navigation Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                to="/rentals"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition"
              >
                <FileText size={17} />
                <span>View All Rentals</span>
              </Link>

              <Link
                to="/explore"
                className="inline-flex items-center gap-2 rounded-full bg-green-900 px-7 py-3.5 text-sm font-bold text-white shadow-md hover:bg-green-800 transition"
              >
                <ShoppingBag size={17} />
                <span>Explore Gear</span>
              </Link>

              <Link
                to="/adventure-kit"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition"
              >
                <Compass size={17} />
                <span>Adventure Kits</span>
              </Link>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <h3 className="font-display text-xl font-bold text-green-950">
              Order Not Found
            </h3>
            <p className="mt-2 text-xs text-slate-500">
              We couldn&apos;t find an active order with reference &quot;{orderId}&quot;.
            </p>
            <Link
              to="/rentals"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-green-900 px-5 py-2.5 text-xs font-bold text-white"
            >
              Back to Order History
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default TrackingPage;
