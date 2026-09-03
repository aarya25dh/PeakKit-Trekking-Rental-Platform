import { Bike, MessageSquare, PhoneCall, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import { DELIVERY_IMAGES } from "../../data/imagePaths";

function DeliveryPartnerCard({
  riderName = "Suman Gurung",
  phone = "+977-9800000000",
  vehicle = "Yamaha FZ (Bagmati 02-045 Pa 3892)",
  trackingId = "PKDLV-48393",
  eta = "Tomorrow, before 4:00 PM",
}) {
  const handleCall = () => {
    toast.success(`Connecting call to rider ${riderName} (${phone})...`);
  };

  const handleMessage = () => {
    toast.success(`Opening direct message channel with ${riderName}...`);
  };

  return (
    <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Delivery Partner Assigned
          </span>
        </div>
        <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
          Tracking ID: <b className="text-green-950">{trackingId}</b>
        </span>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-2 border-emerald-500 bg-emerald-100 shadow-md">
            <img
              src={DELIVERY_IMAGES.riderAvatar}
              alt={riderName}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="absolute inset-0 grid place-items-center bg-emerald-800 text-white font-bold text-lg">
              SG
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display text-lg font-bold text-green-950">
                {riderName}
              </h4>
              <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                ★ 4.9 Rating
              </span>
            </div>

            <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
              <Bike size={14} className="text-emerald-700 shrink-0" />
              <span>{vehicle}</span>
            </p>

            <p className="mt-0.5 text-xs font-semibold text-emerald-800">
              ETA: {eta}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full sm:w-auto items-center gap-2.5">
          <button
            type="button"
            onClick={handleCall}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-full bg-green-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-green-800"
          >
            <PhoneCall size={14} />
            <span>Call Rider</span>
          </button>

          <button
            type="button"
            onClick={handleMessage}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            <MessageSquare size={14} />
            <span>Message</span>
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-xl bg-white p-3 text-xs text-slate-500 border border-emerald-100">
        <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
        <span>Rider is health-screened & carries certified PeakKit sanitization gear seals.</span>
      </div>
    </div>
  );
}

export default DeliveryPartnerCard;
