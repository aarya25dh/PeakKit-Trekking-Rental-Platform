import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { PAYMENT_IMAGES } from "../../data/imagePaths";

const paymentMethods = [
  {
    id: "Credit / Debit Card",
    name: "Credit / Debit Card",
    badge: "Instant",
    description: "Visa, Mastercard & international cards with live preview.",
    logos: [PAYMENT_IMAGES.visa, PAYMENT_IMAGES.mastercard],
    theme: "border-red-500/20 bg-red-50/30",
  },
  {
    id: "eSewa",
    name: "eSewa Mobile Wallet",
    badge: "Popular in Nepal",
    description: "Instant wallet payment with PeakKit Merchant OTP.",
    logos: [PAYMENT_IMAGES.esewa],
    theme: "border-emerald-500/20 bg-emerald-50/30",
  },
  {
    id: "Khalti",
    name: "Khalti Digital Wallet",
    badge: "Instant OTP",
    description: "Secure payment with Khalti PIN & authorization code.",
    logos: [PAYMENT_IMAGES.khalti],
    theme: "border-purple-500/20 bg-purple-50/30",
  },
  {
    id: "PayPal",
    name: "PayPal Checkout",
    badge: "International",
    description: "Global checkout with PayPal account balance or card.",
    logos: [PAYMENT_IMAGES.paypal],
    theme: "border-blue-500/20 bg-blue-50/30",
  },
  {
    id: "Bank Transfer",
    name: "Nepal Bank Transfer",
    badge: "Direct Account",
    description: "Transfer directly to PeakKit through 9+ major Nepal banks.",
    logos: [PAYMENT_IMAGES.bank],
    theme: "border-amber-500/20 bg-amber-50/30",
  },
  {
    id: "Cash on Delivery",
    name: "Cash on Delivery (COD)",
    badge: "Doorstep Payment",
    description: "Pay in cash when your trekking gear is delivered to you.",
    logos: [PAYMENT_IMAGES.cod],
    theme: "border-orange-500/20 bg-orange-50/30",
  },
];

function PaymentSelector({ selectedMethod, onSelectMethod, disabled }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-semibold text-green-950">
            Select Payment Method
          </h3>
          <p className="text-xs text-slate-500">
            Choose your preferred secure payment option
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <motion.button
              type="button"
              key={method.id}
              disabled={disabled}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectMethod(method.id)}
              className={`relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
                isSelected
                  ? "border-green-800 bg-green-50/60 shadow-md ring-2 ring-green-800/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-stone-50/50 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-lg bg-stone-50 px-2 py-1 border border-slate-100">
                    {method.logos.map((logo, idx) => (
                      <img
                        key={idx}
                        src={logo}
                        alt={method.name}
                        className="h-5 max-w-[42px] object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ))}
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-tight text-slate-600">
                    {method.badge}
                  </span>
                </div>

                <div
                  className={`grid h-5 w-5 place-items-center rounded-full border transition ${
                    isSelected
                      ? "border-green-800 bg-green-900 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
              </div>

              <div className="mt-3">
                <strong className="block text-sm font-bold text-slate-900">
                  {method.name}
                </strong>
                <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                  {method.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default PaymentSelector;
