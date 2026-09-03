import { motion } from "framer-motion";
import { CheckCircle2, Clock, Package, ShieldCheck, Truck, Warehouse } from "lucide-react";

const timelineStages = [
  {
    title: "Order Received",
    desc: "Order placed & verified in PeakKit system",
    time: "Today, 10:14 AM",
    icon: CheckCircle2,
    state: "completed",
  },
  {
    title: "Payment Confirmed",
    desc: "Payment authorized via secure gateway",
    time: "Today, 10:15 AM",
    icon: ShieldCheck,
    state: "completed",
  },
  {
    title: "Preparing Your Gear",
    desc: "Gear picked from temperature-controlled shelves",
    time: "Today, 10:45 AM",
    icon: Package,
    state: "current",
  },
  {
    title: "Quality Inspection Complete",
    desc: "Sanitization & safety check by mountain gear tech",
    time: "Est. Today, 1:00 PM",
    icon: ShieldCheck,
    state: "upcoming",
  },
  {
    title: "Packed at Warehouse",
    desc: "Sealed in weather-proof PeakKit transport sacks",
    time: "Est. Today, 3:30 PM",
    icon: Warehouse,
    state: "upcoming",
  },
  {
    title: "Out for Delivery",
    desc: "Dispatched with assigned local rider",
    time: "Est. Tomorrow Morning",
    icon: Truck,
    state: "upcoming",
  },
  {
    title: "Delivered & Handed Over",
    desc: "Gear handed over with inspection checklist",
    time: "Est. 18 Sep 2026",
    icon: CheckCircle2,
    state: "upcoming",
  },
];

function OrderTimeline({ orderId = "PK-2026-483920" }) {
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
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          Live Warehouse Updates
        </div>
      </div>

      <div className="mt-8 relative">
        {/* Vertical Stepper */}
        <div className="space-y-8 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {timelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = stage.state === "completed";
            const isCurrent = stage.state === "current";

            return (
              <motion.div
                key={stage.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative flex items-start gap-4 pl-1"
              >
                {/* Node Dot */}
                <div
                  className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition-all shadow-xs ${
                    isCompleted
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : isCurrent
                      ? "border-amber-500 bg-amber-400 text-green-950 ring-4 ring-amber-100"
                      : "border-slate-300 bg-white text-slate-400"
                  }`}
                >
                  <Icon size={15} strokeWidth={isCompleted ? 2.5 : 2} />
                </div>

                {/* Content */}
                <div className="flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong
                      className={`text-sm font-bold ${
                        isCompleted
                          ? "text-slate-900"
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
