import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Mail,
  MessageCircle,
  Navigation,
  Phone,
  Smartphone,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";

export function CustomerNotificationModal({
  isOpen,
  onClose,
  orderDetails = {},
}) {
  const [activeTab, setActiveTab] = useState("sms");

  if (!isOpen) return null;

  const {
    orderId = "PK-2026-483920",
    txnId = "TXN-PK-483920",
    method = "eSewa",
    amount = 3450,
    pickupDate = "18 Sep 2026",
    customerName = "Aayush Shrestha",
    trackingId = "PKDLV-48393",
  } = orderDetails;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-green-950/70 p-4 backdrop-blur-xs">
      <div className="my-8 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-green-100 text-green-800">
              <Bell size={18} />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                Customer Notification Previews
              </h3>
              <p className="text-xs text-slate-500">
                Live simulated multichannel order notifications
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Channel Switcher Tabs */}
        <div className="mt-6 flex rounded-2xl bg-slate-100 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("sms")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              activeTab === "sms"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Smartphone size={15} /> SMS Notification
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("whatsapp")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              activeTab === "whatsapp"
                ? "bg-[#25D366] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageCircle size={15} /> WhatsApp Message
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              activeTab === "email"
                ? "bg-green-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Mail size={15} /> Email Receipt
          </button>
        </div>

        {/* Tab Previews */}
        <div className="mt-6">
          {/* SMS Preview */}
          {activeTab === "sms" && (
            <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-inner">
              <div className="mb-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Sender: <b>PEAKKIT-NP</b></span>
                <span>Just Now</span>
              </div>
              <div className="rounded-2xl bg-white p-4 text-xs leading-relaxed text-slate-800 shadow-xs border border-slate-200/80">
                <p className="font-bold text-green-900">🏔️ PeakKit Nepal</p>
                <p className="mt-2">
                  Namaste {customerName}! Your order <b>{orderId}</b> has been confirmed.
                </p>
                <div className="my-2 rounded-xl bg-stone-50 p-2.5 text-[11px] font-mono text-slate-700 space-y-1">
                  <p>• Payment: <b>{method}</b></p>
                  <p>• Amount: <b>Rs. {amount.toLocaleString()}</b></p>
                  <p>• Delivery / Pickup: <b>{pickupDate}</b></p>
                  <p>• Tracking: <b>{trackingId}</b></p>
                </div>
                <p className="text-[11px] text-slate-500">
                  Track your gear anytime on PeakKit: peakkit.np/track/{orderId}
                </p>
              </div>
            </div>
          )}

          {/* WhatsApp Preview */}
          {activeTab === "whatsapp" && (
            <div className="mx-auto max-w-md rounded-3xl bg-[#0b141a] p-4 text-white shadow-lg">
              <div className="mb-3 flex items-center gap-2.5 border-b border-white/10 pb-3">
                <div className="h-8 w-8 rounded-full bg-[#00a884] flex items-center justify-center font-bold text-xs">
                  PK
                </div>
                <div>
                  <h5 className="text-xs font-bold">PeakKit Nepal Official</h5>
                  <p className="text-[10px] text-[#00a884]">Verified Business Account</p>
                </div>
              </div>

              <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-xs bg-[#005c4b] p-4 text-xs text-white shadow-sm leading-relaxed">
                <p className="font-bold">🏔️ PeakKit Gear Reservation</p>
                <p className="mt-2">
                  Thank you for choosing PeakKit for your upcoming trek! Your trekking gear is now being carefully prepped and sanitized.
                </p>
                <div className="my-2.5 rounded-xl bg-black/20 p-3 space-y-1 font-mono text-[11px]">
                  <p>📦 Order ID: <b>{orderId}</b></p>
                  <p>🚚 Tracking ID: <b>{trackingId}</b></p>
                  <p>⏰ Est. Delivery: <b>Tomorrow before 4:00 PM</b></p>
                  <p>💳 Paid via: <b>{method}</b></p>
                </div>
                <p className="text-[11px] text-white/80">
                  Our rider Suman Gurung will call you prior to arrival. Need help? Reply directly to this chat.
                </p>
                <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-white/60">
                  <span>10:15 AM</span>
                  <CheckCheck size={14} className="text-[#53bdeb]" />
                </div>
              </div>
            </div>
          )}

          {/* Email Preview */}
          {activeTab === "email" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-green-950 font-display font-bold text-lg">
                  <span>🏔️ PEAKKIT</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">Invoice #{txnId}</span>
              </div>

              <div className="mt-4">
                <h4 className="font-display text-xl font-bold text-green-950">
                  Your reservation is confirmed!
                </h4>
                <p className="mt-1 text-xs text-slate-600">
                  Hi {customerName}, we're getting your high-altitude equipment ready for the mountains.
                </p>

                <div className="mt-4 rounded-2xl bg-stone-50 p-4 text-xs text-slate-700 space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span>Order Reference:</span>
                    <b className="font-mono text-slate-900">{orderId}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <b className="font-mono text-slate-900">{txnId}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <b className="text-slate-900">{method}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Rental Pickup:</span>
                    <b className="text-slate-900">{pickupDate}</b>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm text-green-950">
                    <span>Total Amount:</span>
                    <span>Rs. {amount.toLocaleString()}</span>
                  </div>
                </div>

                <p className="mt-4 text-[11px] text-slate-500">
                  Need modifications? Contact support@peakkit.np or call +977-1-4412345.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-green-900 px-6 py-2.5 text-xs font-bold text-white transition hover:bg-green-800"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeliveryPartnerNotificationModal({
  isOpen,
  onClose,
  orderDetails = {},
}) {
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  const {
    orderId = "PK-2026-483920",
    customerName = "Aayush Shrestha",
    phone = "+977-9841234567",
    deliveryAddress = "House 42, Gairidhara Road, Kathmandu (44600)",
    landmark = "Opposite Japanese Embassy",
    method = "Cash on Delivery",
    amount = 3450,
    instructions = "Call upon arrival at the gate, please inspect gear checklist.",
    items = [
      { name: "Alpine Trek 45L Pack", quantity: 1 },
      { name: "Down Ridge Shell Jacket", quantity: 1 },
    ],
  } = orderDetails;

  const isCOD = method.toLowerCase().includes("cash") || method.toLowerCase().includes("cod");

  const handleAccept = () => {
    setAccepted(true);
    toast.success("Delivery accepted! Navigation route mapped to Kathmandu Hub.");
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-xs">
      <div className="my-8 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 text-amber-900 font-bold">
              🚚
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                PeakKit Rider Dispatch
              </span>
              <h3 className="font-display text-lg font-bold text-slate-900">
                New Delivery Assigned
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4 text-xs">
          {/* Order & Payment status */}
          <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-4 border border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Order ID
              </span>
              <p className="font-mono text-sm font-bold text-slate-900">{orderId}</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Payment Type
              </span>
              <p
                className={`font-bold ${
                  isCOD ? "text-orange-700" : "text-emerald-700"
                }`}
              >
                {method}
              </p>
            </div>
          </div>

          {/* COD Collect Alert */}
          {isCOD && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3.5 text-orange-900 font-semibold flex items-center justify-between">
              <span>⚠️ Collect Cash on Delivery:</span>
              <strong className="text-sm font-bold text-orange-950">
                Rs. {amount.toLocaleString()}
              </strong>
            </div>
          )}

          {/* Pickup & Destination */}
          <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start gap-2.5">
              <div className="h-2 w-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Pickup Hub
                </span>
                <p className="font-semibold text-slate-900">
                  PeakKit Central Warehouse, Thamel Hub #3
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 border-t border-slate-100 pt-2.5">
              <div className="h-2 w-2 rounded-full bg-red-600 mt-1.5 shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Customer Destination
                </span>
                <p className="font-semibold text-slate-900">{deliveryAddress}</p>
                {landmark && (
                  <p className="text-slate-500 text-[11px]">Landmark: {landmark}</p>
                )}
              </div>
            </div>
          </div>

          {/* Customer details */}
          <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-4 border border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Customer Name
              </span>
              <p className="font-bold text-slate-900">{customerName}</p>
            </div>

            <button
              type="button"
              onClick={() => toast.success(`Calling customer ${phone}...`)}
              className="inline-flex items-center gap-1.5 rounded-full bg-green-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-green-800"
            >
              <Phone size={13} /> {phone}
            </button>
          </div>

          {/* Items checklist */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <span className="text-[10px] font-bold uppercase text-slate-400">
              Items to Deliver
            </span>
            <ul className="mt-2 space-y-1.5">
              {items.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between text-slate-700">
                  <span>• {item.name || "PeakKit Trekking Gear"}</span>
                  <b className="text-slate-900">x{item.quantity || 1}</b>
                </li>
              ))}
            </ul>

            {instructions && (
              <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500 italic">
                Note: "{instructions}"
              </div>
            )}
          </div>
        </div>

        {/* Rider Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={accepted}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-green-900 px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-green-800 disabled:opacity-50"
          >
            <Check size={16} />
            <span>{accepted ? "Delivery Accepted" : "Accept Delivery"}</span>
          </button>

          <button
            type="button"
            onClick={() => toast.success("Route loaded in Google Maps / Pathao navigator.")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <Navigation size={15} />
            <span>View Route</span>
          </button>
        </div>
      </div>
    </div>
  );
}
