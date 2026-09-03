import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { PAYMENT_IMAGES } from "../../data/imagePaths";

function PaypalForm({ amount, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [remember, setRemember] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const isValid = email.includes("@") && password.length >= 4;

  const handleLoginAndPay = (e) => {
    e.preventDefault();
    if (!isValid || processing) return;

    setProcessing(true);
    setTimeout(() => {
      setAuthenticated(true);
      setTimeout(() => {
        setProcessing(false);
        const txnId = `PAYPAL-TXN-${Math.floor(100000 + Math.random() * 900000)}`;
        onSuccess({
          method: "PayPal",
          txnId,
          customerName: email.split("@")[0] || "PayPal Customer",
          email,
          phone: phone || "+977-9800000000",
        });
      }, 900);
    }, 1000);
  };

  return (
    <div className="space-y-6 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-12 items-center justify-center rounded-xl bg-blue-50 p-1.5 border border-blue-100">
            <img
              src={PAYMENT_IMAGES.paypal}
              alt="PayPal"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">
              PayPal Checkout
            </h3>
            <p className="text-xs text-slate-500">
              International & balance payments
            </p>
          </div>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 border border-blue-200">
          Global Verified
        </span>
      </div>

      <form onSubmit={handleLoginAndPay} className="space-y-4">
        {/* Read-Only Amount */}
        <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Payable Amount
            </span>
            <p className="text-2xl font-bold text-blue-950">
              Rs. {amount.toLocaleString()}
            </p>
          </div>
          <span className="text-xs text-blue-700 bg-white px-2.5 py-1 rounded-lg shadow-xs font-medium">
            ≈ USD ${(amount / 135).toFixed(2)}
          </span>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            PayPal Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            PayPal Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Contact Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+977 98XXXXXXXX"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Remember device checkbox */}
        <label className="flex items-center gap-2.5 pt-1 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
          />
          <span>Remember this device for faster one-click checkout</span>
        </label>

        {/* Security badge */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100">
          <ShieldCheck size={16} className="text-blue-600 shrink-0" />
          <span>Protected by PayPal Purchase Protection & 256-bit encryption.</span>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!isValid || processing}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#0070ba] px-6 py-4 text-sm font-bold text-white shadow-md transition hover:bg-[#005ea6] disabled:opacity-50"
        >
          {processing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>{authenticated ? "Payment Authorized..." : "Authenticating with PayPal..."}</span>
            </>
          ) : (
            <>
              <Lock size={16} />
              <span>Pay with PayPal (Rs. {amount.toLocaleString()})</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default PaypalForm;
