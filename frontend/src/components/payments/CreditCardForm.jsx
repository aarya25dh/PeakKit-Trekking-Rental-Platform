import { useState, useMemo } from "react";
import { Check, CreditCard, Lock, ShieldCheck } from "lucide-react";
import { PAYMENT_IMAGES } from "../../data/imagePaths";

function CreditCardForm({ amount, onSuccess }) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("Nepal");
  const [processing, setProcessing] = useState(false);

  // Formatting helpers
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(" ") || raw;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 2) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiry(raw);
    }
  };

  const handleCvvChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvv(raw);
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(raw);
  };

  // Validations
  const isValidCard = cardNumber.replace(/\s/g, "").length === 16;
  const isValidHolder = cardHolder.trim().length >= 3;
  const isValidExpiry = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry);
  const isValidCvv = cvv.length >= 3;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = phone.length === 10;
  const isValidAddress = address.trim().length >= 3;
  const isValidZip = zip.trim().length >= 3;

  const isFormValid =
    isValidCard &&
    isValidHolder &&
    isValidExpiry &&
    isValidCvv &&
    isValidEmail &&
    isValidPhone &&
    isValidAddress &&
    isValidZip;

  const cardType = useMemo(() => {
    const num = cardNumber.replace(/\s/g, "");
    if (num.startsWith("4")) return "visa";
    if (num.startsWith("5")) return "mastercard";
    return "card";
  }, [cardNumber]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid || processing) return;

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const txnId = `TXN-PK-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      onSuccess({
        method: "Credit / Debit Card",
        txnId,
        customerName: cardHolder,
        email,
        phone,
        billingAddress: `${address}, ${zip}, ${country}`,
        cardLast4: cardNumber.replace(/\s/g, "").slice(-4) || "4242",
      });
    }, 1200);
  };

  return (
    <div className="space-y-6 rounded-3xl border border-red-900/15 bg-white p-6 shadow-sm sm:p-8">
      {/* Live Interactive Card Preview */}
      <div className="mx-auto w-full max-w-md perspective-1000">
        <div
          className={`relative h-56 w-full rounded-2xl p-6 text-white shadow-xl transition-all duration-500 bg-gradient-to-tr from-[#6b0f1a] via-[#8B0000] to-[#b22222] border border-red-400/20`}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-10 rounded-md bg-amber-300/80 shadow-inner flex items-center justify-center">
                <div className="h-4 w-6 border border-amber-800/40 rounded-sm" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
                PeakKit Secure
              </span>
            </div>

            <div className="flex items-center gap-2">
              <img
                src={PAYMENT_IMAGES.visa}
                alt="Visa"
                className={`h-6 max-w-[45px] object-contain transition-opacity ${
                  cardType === "mastercard" ? "opacity-30" : "opacity-100"
                }`}
              />
              <img
                src={PAYMENT_IMAGES.mastercard}
                alt="Mastercard"
                className={`h-6 max-w-[45px] object-contain transition-opacity ${
                  cardType === "visa" ? "opacity-30" : "opacity-100"
                }`}
              />
            </div>
          </div>

          {/* Card Number */}
          <div className="mt-8">
            <p className="font-mono text-xl sm:text-2xl font-bold tracking-[0.22em] text-white drop-shadow">
              {cardNumber || "•••• •••• •••• ••••"}
            </p>
          </div>

          {/* Card Footer */}
          <div className="mt-6 flex items-end justify-between text-xs">
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-white/60">
                Card Holder
              </span>
              <p className="font-semibold uppercase tracking-wide text-white truncate max-w-[190px]">
                {cardHolder || "YOUR NAME HERE"}
              </p>
            </div>

            <div className="text-right">
              <span className="block text-[9px] uppercase tracking-wider text-white/60">
                Expires
              </span>
              <p className="font-mono font-semibold text-white">
                {expiry || "MM/YY"}
              </p>
            </div>

            <div className="text-right">
              <span className="block text-[9px] uppercase tracking-wider text-white/60">
                CVV
              </span>
              <p className="font-mono font-semibold text-white">
                {cvv ? "•••" : "•••"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Details */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Number */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Card Number
          </label>
          <div className="relative mt-1.5">
            <CreditCard
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              required
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="4111 2222 3333 4444"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm font-mono font-semibold text-slate-900 outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-100"
            />
            {isValidCard && (
              <Check
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600"
              />
            )}
          </div>
        </div>

        {/* Cardholder Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Cardholder Name
          </label>
          <div className="relative mt-1.5">
            <input
              type="text"
              required
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              placeholder="e.g. Aayush Shrestha"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-100"
            />
            {isValidHolder && (
              <Check
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600"
              />
            )}
          </div>
        </div>

        {/* Expiry & CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Expiry Date
            </label>
            <div className="relative mt-1.5">
              <input
                type="text"
                required
                value={expiry}
                onChange={handleExpiryChange}
                placeholder="MM/YY"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono text-slate-900 outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-100"
              />
              {isValidExpiry && (
                <Check
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              CVV / CVC
            </label>
            <div className="relative mt-1.5">
              <input
                type="password"
                required
                maxLength={4}
                value={cvv}
                onChange={handleCvvChange}
                placeholder="•••"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono text-slate-900 outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-100"
              />
              {isValidCvv && (
                <Check
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600"
                />
              )}
            </div>
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Email Address
            </label>
            <div className="relative mt-1.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-100"
              />
              {isValidEmail && (
                <Check
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Phone Number (10 Digits)
            </label>
            <div className="relative mt-1.5">
              <input
                type="tel"
                required
                value={phone}
                onChange={handlePhoneChange}
                placeholder="98XXXXXXXX"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-100"
              />
              {isValidPhone && (
                <Check
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600"
                />
              )}
            </div>
          </div>
        </div>

        {/* Billing Address & ZIP & Country */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Billing Address
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Lazimpat, Ward 2"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              ZIP / Postal Code
            </label>
            <input
              type="text"
              required
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="44600"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-800 focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Country
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-red-800"
          >
            <option>Nepal</option>
            <option>India</option>
            <option>United States</option>
            <option>United Kingdom</option>
            <option>Australia</option>
            <option>Germany</option>
            <option>France</option>
            <option>Singapore</option>
            <option>Other</option>
          </select>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 rounded-xl bg-stone-50 p-3 text-xs text-slate-500 border border-slate-100">
          <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
          <span>
            256-bit SSL simulated encryption. Real card information is never charged.
          </span>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!isFormValid || processing}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#8B0000] px-6 py-4 text-sm font-bold text-white shadow-md transition hover:bg-[#6b0f1a] disabled:opacity-50"
        >
          {processing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Payment Processing...</span>
            </>
          ) : (
            <>
              <Lock size={16} />
              <span>Pay Rs. {amount.toLocaleString()} Securely</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default CreditCardForm;
