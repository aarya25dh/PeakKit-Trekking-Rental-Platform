import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Package,
  ShieldCheck,
  Sparkles,
  Truck,
  UserCheck,
  Warehouse,
  XCircle,
} from "lucide-react";
import { ordersAPI } from "../../services/api";

const iconMap = {
  reservation: CheckCircle2,
  payment: ShieldCheck,
  sanitize: Sparkles,
  pack: Warehouse,
  rider: UserCheck,
  delivery: Truck,
  delivered: Package,
  return: Clock,
};

const canonicalStages = [
  { key: "reservation", title: "Reservation Confirmed", icon: CheckCircle2, defaultDesc: "Reservation placed & verified in PeakKit system" },
  { key: "payment", title: "Payment Verified", icon: ShieldCheck, defaultDesc: "Payment authorized via secure gateway" },
  { key: "sanitize", title: "Gear Sanitized", icon: Sparkles, defaultDesc: "Sanitization & safety check by mountain gear tech" },
  { key: "pack", title: "Packed At PeakKit Warehouse", icon: Warehouse, defaultDesc: "Sealed in weather-proof PeakKit transport sacks" },
  { key: "rider", title: "Rider Assigned", icon: UserCheck, defaultDesc: "Delivery rider assigned from local warehouse hub" },
  { key: "delivery", title: "Out For Delivery", icon: Truck, defaultDesc: "Dispatched with assigned local rider" },
  { key: "delivered", title: "Delivered", icon: Package, defaultDesc: "Gear handed over with inspection checklist" },
];

function OrderTimeline({ orderId = "PK-2026-000015", initialOrder = null }) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);

  const fetchOrderTracking = async () => {
    if (!orderId) return;
    try {
      const res = await ordersAPI.getById(orderId);
      if (res.data?.order) {
        setOrder(res.data.order);
      }
    } catch {
      // Keep existing state on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderTracking();
    // Task 7: Auto-refresh tracking every 20 seconds
    const interval = setInterval(fetchOrderTracking, 20000);
    return () => clearInterval(interval);
  }, [orderId]);

  const backendEvents = order?.tracking_events || [];
  const backendEventTitles = new Set(backendEvents.map((e) => e.title?.toLowerCase()));

  // Build unified stages: map canonical stages with backend event status
  const stages = canonicalStages.map((stage, idx) => {
    const matchedBackend = backendEvents.find(
      (e) =>
        e.title?.toLowerCase() === stage.title.toLowerCase() ||
        e.icon?.toLowerCase() === stage.key.toLowerCase()
    );

    const isCompleted = Boolean(matchedBackend);
    const desc = matchedBackend?.description || stage.defaultDesc;
    const time = matchedBackend?.timestamp
      ? new Date(matchedBackend.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }) +
        ", " +
        new Date(matchedBackend.timestamp).toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })
      : "Upcoming";

    return {
      title: stage.title,
      desc,
      time,
      icon: stage.icon,
      isCompleted,
      index: idx,
    };
  });

  // Find index of current active step (the first incomplete step or the last completed)
  const completedCount = stages.filter((s) => s.isCompleted).length;
  const currentStepIndex = Math.min(completedCount, stages.length - 1);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            Live Order Tracking
          </span>
          <h3 className="mt-1 font-display text-2xl font-bold text-green-950">
            Shipping & Preparation Timeline
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Order Reference: <strong className="text-green-900">{orderId}</strong>
            {order?.order_status && (
              <span className="ml-2 capitalize rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                {order.order_status.replace("_", " ")}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          Live Warehouse Updates (20s)
        </div>
      </div>

      <div className="mt-8 relative">
        {/* Vertical Stepper */}
        <div className="space-y-8 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = stage.isCompleted;
            const isCurrent = idx === currentStepIndex && !isCompleted;

            return (
              <motion.div
                key={stage.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="relative flex items-start gap-4 pl-1"
              >
                {/* Node Dot */}
                <div
                  className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition-all shadow-xs ${
                    isCompleted
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : isCurrent
                      ? "border-amber-500 bg-amber-400 text-green-950 ring-4 ring-amber-100 animate-pulse"
                      : "border-slate-300 bg-white text-slate-400"
                  }`}
                >
                  <Icon size={15} strokeWidth={isCompleted ? 2.5 : 2} />
                </div>

                {/* Content */}
                <div className="flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong
                      className={`text-sm ${
                        isCompleted
                          ? "text-slate-900 font-bold"
                          : isCurrent
                          ? "text-green-950 font-extrabold"
                          : "text-slate-500 font-medium"
                      }`}
                    >
                      {stage.title}
                    </strong>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock size={12} /> {stage.time}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{stage.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OrderTimeline;
