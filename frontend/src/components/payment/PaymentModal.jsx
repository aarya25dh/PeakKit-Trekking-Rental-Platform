import { useState } from "react";
import { CreditCard, LoaderCircle, X } from "lucide-react";
import { PAYMENT_IMAGES } from "../../data/imagePaths";

const methods = [
  ["Credit / Debit Card", PAYMENT_IMAGES.visa],
  ["PayPal", PAYMENT_IMAGES.paypal],
  ["eSewa", PAYMENT_IMAGES.esewa],
  ["Khalti", PAYMENT_IMAGES.khalti],
  ["Bank Transfer", PAYMENT_IMAGES.bank],
];

const fields = {
  "Credit / Debit Card": [
    "Card Number",
    "Cardholder Name",
    "Expiry Month",
    "Expiry Year",
    "CVV",
    "Email",
    "Phone Number",
    "Billing ZIP Code",
    "Voucher Code",
  ],
  PayPal: ["Email", "Password", "Phone Number"],
  eSewa: ["eSewa ID", "Registered Phone Number", "MPIN", "Voucher Code"],
  Khalti: ["Khalti ID", "Phone Number", "MPIN", "Promo Code"],
  "Bank Transfer": [
    "Account Holder",
    "Account Number",
    "Branch",
    "Reference ID",
  ],
};

function PaymentModal({ amount, onClose, onSuccess }) {
  const [method, setMethod] = useState("");
  const [processing, setProcessing] = useState(false);
  const [bank, setBank] = useState("Nabil Bank");

  const submit = (event) => {
    event.preventDefault();
    setProcessing(true);

    window.setTimeout(() => {
      setProcessing(false);
      onSuccess(method);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-green-950/70 p-5">
      <div className="my-6 w-full max-w-3xl rounded-[2rem] bg-white p-8 shadow-2xl sm:p-10">
        {!method ? (
          <MethodPicker
            amount={amount}
            onClose={onClose}
            choose={setMethod}
          />
        ) : (
          <form onSubmit={submit} className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
                  Secure payment
                </p>

                <h2 className="mt-2 font-display text-3xl font-semibold text-green-950">
                  {method}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close payment"
                className="rounded-full p-2 text-slate-400 transition hover:bg-stone-100"
              >
                <X />
              </button>
            </div>

            {/* Amount */}
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-xs uppercase tracking-wide text-green-700">
                Payable Amount
              </p>

              <p className="mt-1 text-3xl font-bold text-green-900">
                NPR {amount.toLocaleString()}
              </p>
            </div>

            {/* Gateway */}
            <div className="flex flex-wrap items-center justify-between rounded-xl bg-stone-50 px-5 py-4 text-sm font-semibold">
              <span className="flex items-center gap-2 text-slate-700">
                <CreditCard size={17} />
                Simulated gateway
              </span>

              {method === "Credit / Debit Card" && (
                <span className="mt-3 flex gap-2 sm:mt-0">
                  <img
                    src={PAYMENT_IMAGES.visa}
                    alt="Visa"
                    className="h-6 w-10 object-contain"
                  />
                  <img
                    src={PAYMENT_IMAGES.mastercard}
                    alt="Mastercard"
                    className="h-6 w-10 object-contain"
                  />
                </span>
              )}
            </div>

            {/* Bank selector */}
            {method === "Bank Transfer" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Select Bank
                </label>

                <select
                  value={bank}
                  onChange={(event) => setBank(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-700"
                >
                  <option>Nabil Bank</option>
                  <option>Global IME</option>
                  <option>NIC Asia</option>
                  <option>Siddhartha Bank</option>
                  <option>Kumari Bank</option>
                  <option>Everest Bank</option>
                  <option>Machhapuchhre Bank</option>
                </select>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              {fields[method].map((label) => (
                <div key={label}>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {label}
                  </label>

                  <input
                    required
                    type={
                      label === "Email"
                        ? "email"
                        : label === "Password" || label === "MPIN"
                        ? "password"
                        : "text"
                    }
                    placeholder={`Enter ${label}`}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              ))}
            </div>

            {/* Checkbox */}
            <div className="rounded-xl bg-stone-50 px-4 py-3">
              <label className="flex items-center gap-3 text-sm text-slate-600">
                <input type="checkbox" className="accent-green-900" />
                Remember this payment method for future purchases.
              </label>
            </div>

            {/* Pay Button */}
            <button
              disabled={processing}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-green-900 px-5 py-4 text-sm font-bold text-white transition hover:bg-green-800 disabled:opacity-60"
            >
              {processing ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Processing payment...
                </>
              ) : (
                `Pay NPR ${amount.toLocaleString()} securely`
              )}
            </button>

            {/* Switch Method */}
            <button
              type="button"
              onClick={() => setMethod("")}
              className="w-full text-center text-sm text-slate-500 transition hover:text-green-900"
            >
              Choose another payment method
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function MethodPicker({ amount, onClose, choose }) {
  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            Secure simulation
          </p>

          <h2 className="mt-2 font-display text-3xl font-semibold text-green-950">
            Choose payment method
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Amount payable:{" "}
            <strong className="text-green-900">
              NPR {amount.toLocaleString()}
            </strong>
          </p>
        </div>

        <button
          onClick={onClose}
          aria-label="Close payment"
          className="rounded-full p-2 text-slate-400 transition hover:bg-stone-100"
        >
          <X />
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {methods.map(([name, logo]) => (
          <button
            key={name}
            onClick={() => choose(name)}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 p-5 text-left transition hover:-translate-y-0.5 hover:border-green-700 hover:shadow-md"
          >
            <div className="grid h-14 w-16 place-items-center rounded-xl bg-stone-50 p-2">
              <img
                src={logo}
                alt={`${name} logo`}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <span className="text-sm font-bold text-slate-800">{name}</span>
          </button>
        ))}
      </div>

      <button
        onClick={onClose}
        className="mt-8 w-full text-center text-sm text-slate-500 transition hover:text-green-900"
      >
        Cancel
      </button>
    </>
  );
}

export default PaymentModal;