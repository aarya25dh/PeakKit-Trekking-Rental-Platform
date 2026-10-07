import { useState } from "react";
import { Lock, ShieldCheck, Smartphone } from "lucide-react";
import { PAYMENT_IMAGES } from "../../data/imagePaths";
import OtpVerification from "./OtpVerification";

function KhaltiForm({ amount, onSuccess }) {
  const [khaltiId, setKhaltiId] = useState("");
  const [mpin, setMpin] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [processing, setProcessing] = useState(false);

  const isValidInitial = khaltiId.length >= 10 && mpin.length >= 4;

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!isValidInitial) return;
    setShowOtp(true);
  };

  const handleFinalPayment = (e) => {
    e.preventDefault();
    if (!isOtpVerified || processing) return;

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const txnId = `KHALTI-TXN-${Math.floor(100000 + Math.random() * 900000)}`;
      onSuccess({
        method: "Khalti",
        txnId,
        customerName: `Khalti User (${khaltiId})`,
        phone: khaltiId,
        email: `${khaltiId}@khalti.com`,
      });
    }, 300);
  };

  return (
    <div className="space-y-6 rounded-3xl border border-purple-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Khalti Branded Header */}
      <div className="flex items-center justify-between border-b border-purple-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-14 items-center justify-center rounded-xl bg-purple-50 p-1.5 border border-purple-200">
            <img
              src={PAYMENT_IMAGES.khalti}
              alt="Khalti"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">
              Khalti Digital Wallet
            </h3>
            <p className="text-xs text-purple-700 font-semibold">
              Instant Authorization & Cashbacks
            </p>
          </div>
        </div>

        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-900 border border-purple-200">
          Smart Pay
        </span>
      </div>

      {/* Read-Only Amount */}
      <div className="flex items-center justify-between rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
            Payable Amount
          </span>
          <p className="text-2xl font-bold text-[#5c2d91]">
            Rs. {amount.toLocaleString()}
          </p>
        </div>
        <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-purple-800 shadow-xs border border-purple-200">
          Instant Checkout
        </span>
      </div>

      <form onSubmit={isOtpVerified ? handleFinalPayment : handleSendOtp} className="space-y-4">
        {/* Khalti Mobile / ID */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Khalti Registered Mobile Number
          </label>
          <div className="relative mt-1.5">
            <Smartphone
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="tel"
              required
              disabled={isOtpVerified}
              maxLength={10}
              value={khaltiId}
              onChange={(e) => setKhaltiId(e.target.value.replace(/\D/g, ""))}
              placeholder="98XXXXXXXX"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-purple-700 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* MPIN */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Khalti 4-Digit PIN
          </label>
          <input
            type="password"
            required
            disabled={isOtpVerified}
            maxLength={6}
            value={mpin}
            onChange={(e) => setMpin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono text-slate-900 outline-none transition focus:border-purple-700 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-50"
          />
        </div>

        {/* OTP Flow */}
        {!showOtp && (
          <button
            type="button"
            disabled={!isValidInitial}
            onClick={() => setShowOtp(true)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#5c2d91] px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#4d257a] disabled:opacity-50"
          >
            <Smartphone size={16} />
            <span>Generate Khalti OTP</span>
          </button>
        )}

        {showOtp && (
          <div className="space-y-4 pt-2">
            <OtpVerification
              phoneOrEmail={khaltiId || "98XXXXXXXX"}
              themeColor="purple"
              onVerified={() => setIsOtpVerified(true)}
            />

            <button
              type="submit"
              disabled={!isOtpVerified || processing}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#5c2d91] px-6 py-4 text-sm font-bold text-white shadow-md transition hover:bg-[#4d257a] disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Processing Khalti Payment...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Pay with Khalti (Rs. {amount.toLocaleString()})</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100">
          <ShieldCheck size={16} className="text-[#5c2d91] shrink-0" />
          <span>Encrypted with Khalti Digital Payment Security token protocol.</span>
        </div>
      </form>
    </div>
  );
}

export default KhaltiForm;
