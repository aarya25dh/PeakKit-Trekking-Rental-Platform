import { useState } from "react";
import { CalendarDays, CheckCircle2, ShieldCheck, Tag, Trash2, XCircle } from "lucide-react";

const availableVouchers = {
  TREK10: { code: "TREK10", type: "percent", value: 10, desc: "10% off gear rental subtotal" },
  WELCOME500: { code: "WELCOME500", type: "fixed", value: 500, desc: "Rs. 500 flat welcome discount" },
  EVEREST15: { code: "EVEREST15", type: "percent", value: 15, desc: "15% off mountain gear discount" },
};

function OrderSummary({
  items = [],
  rentalSubtotal = 0,
  deposits = 0,
  deliveryFee = 0,
  pickupDate = "2026-09-18",
  returnDate = "2026-09-25",
  durationDays = 7,
  voucher,
  onApplyVoucher,
  onRemoveVoucher,
  onProceedToPayment,
}) {
  const [inputCode, setInputCode] = useState("");
  const [voucherError, setVoucherError] = useState("");

  const handleApply = (e) => {
    e?.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (!clean) {
      // If empty: No popup, no validation error, only ignore it
      setVoucherError("");
      return;
    }

    if (availableVouchers[clean]) {
      setVoucherError("");
      onApplyVoucher(availableVouchers[clean]);
      setInputCode("");
    } else {
      setVoucherError(`Invalid code "${clean}". Try TREK10, WELCOME500, or EVEREST15.`);
    }
  };

  // Calculate voucher discount amount
  let voucherDiscount = 0;
  if (voucher) {
    if (voucher.type === "percent") {
      voucherDiscount = Math.round((rentalSubtotal * voucher.value) / 100);
    } else if (voucher.type === "fixed") {
      voucherDiscount = Math.min(voucher.value, rentalSubtotal);
    }
  }

  const grandTotal = Math.max(0, rentalSubtotal - voucherDiscount + deposits + deliveryFee);

  return (
    <aside className="space-y-5">
      <div className="rounded-3xl bg-green-950 p-6 sm:p-7 text-white shadow-xl lg:sticky lg:top-24">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-4">
          <h2 className="font-display text-xl font-bold tracking-tight text-white">
            Order Summary
          </h2>
          <span className="rounded-full bg-amber-400/20 px-3 py-0.5 text-xs font-bold text-amber-300 border border-amber-400/30">
            {items.length} {items.length === 1 ? "Item" : "Items"}
          </span>
        </div>

        {/* Rental Timeline Badge */}
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 p-3.5 text-xs text-white/90 backdrop-blur-xs border border-white/10">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-amber-300 shrink-0" />
            <span>
              <b>{durationDays} Days</b> ({pickupDate} to {returnDate})
            </span>
          </div>
          <span className="text-amber-300 font-semibold uppercase text-[10px]">
            Fixed Dates
          </span>
        </div>

        {/* Itemised Mini List */}
        <div className="mt-4 max-h-48 overflow-y-auto space-y-2.5 pr-1 text-xs">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-2 border border-white/5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-10 w-10 rounded-lg object-cover bg-white/10 shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="min-w-0">
                  <p className="font-medium text-white truncate max-w-[170px]">
                    {item.name}
                  </p>
                  <span className="text-[11px] text-white/60">
                    Qty: {item.quantity || 1} · {item.condition || "Verified"}
                  </span>
                </div>
              </div>
              <strong className="text-amber-300 shrink-0">
                Rs. {((item.rentalPrice || 500) * (item.quantity || 1)).toLocaleString()}
              </strong>
            </div>
          ))}
        </div>

        {/* Price Breakdown */}
        <div className="mt-5 space-y-3 border-t border-white/15 pt-5 text-sm text-white/75">
          <div className="flex justify-between">
            <span>Rental Subtotal</span>
            <b className="text-white">Rs. {rentalSubtotal.toLocaleString()}</b>
          </div>

          <div className="flex justify-between">
            <span>Refundable Deposit</span>
            <b className="text-white">Rs. {deposits.toLocaleString()}</b>
          </div>

          <div className="flex justify-between">
            <span>Delivery & Logistics</span>
            <b className="text-white">
              {deliveryFee > 0 ? `Rs. ${deliveryFee.toLocaleString()}` : "Free"}
            </b>
          </div>

          <div className="flex justify-between">
            <span>Estimated Tax</span>
            <b className="text-white/60">0% (Inclusive)</b>
          </div>

          {voucher && (
            <div className="flex justify-between text-emerald-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Tag size={14} /> Voucher ({voucher.code})
              </span>
              <span>- Rs. {voucherDiscount.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Voucher Code Form */}
        <div className="mt-5 border-t border-white/15 pt-5">
          {voucher ? (
            <div className="flex items-center justify-between rounded-xl bg-emerald-950/80 p-3 border border-emerald-500/40 text-xs text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <div>
                  <strong className="block text-white font-bold">{voucher.code} Applied</strong>
                  <span className="text-[11px] text-emerald-300">{voucher.desc}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onRemoveVoucher}
                className="rounded-lg p-1.5 text-red-300 hover:bg-white/10 hover:text-red-100 transition"
                aria-label="Remove voucher"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                  />
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(e.target.value.toUpperCase());
                      if (voucherError) setVoucherError("");
                    }}
                    placeholder="Enter voucher code (optional)"
                    className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-9 pr-3 text-xs uppercase text-white placeholder:text-white/40 outline-none focus:border-amber-300"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApply}
                  className="rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-green-950 hover:bg-amber-300 transition"
                >
                  Apply
                </button>
              </div>

              {voucherError && (
                <p className="mt-2 flex items-center gap-1 text-xs text-red-300">
                  <XCircle size={13} /> {voucherError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div className="mt-6 flex items-baseline justify-between border-t border-white/20 pt-4">
          <div>
            <span className="block text-xs uppercase tracking-wider text-white/70 font-semibold">
              Grand Total Payable
            </span>
            <small className="text-[11px] text-white/50">
              Includes rental, deposit & delivery
            </small>
          </div>
          <strong className="font-display text-2xl sm:text-3xl font-bold text-amber-300">
            Rs. {grandTotal.toLocaleString()}
          </strong>
        </div>

        {/* Proceed to Payment Button */}
        {onProceedToPayment && (
          <button
            type="button"
            onClick={onProceedToPayment}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 px-6 py-4 text-sm font-bold text-green-950 shadow-lg shadow-amber-400/20 transition hover:from-amber-300 hover:to-amber-200 active:scale-[0.99]"
          >
            <span>Proceed to Payment</span>
            <span className="font-mono text-xs font-bold bg-green-950/15 px-2 py-0.5 rounded-full">
              Rs. {grandTotal.toLocaleString()}
            </span>
          </button>
        )}

        <div className="mt-5 flex items-center gap-2 text-[11px] text-white/50">
          <ShieldCheck size={16} className="text-amber-400 shrink-0" />
          <span>Security deposits are automatically released upon gear return.</span>
        </div>
      </div>
    </aside>
  );
}

export default OrderSummary;
