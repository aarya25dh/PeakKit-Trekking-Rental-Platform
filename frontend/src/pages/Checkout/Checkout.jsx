import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  Compass,
  FileText,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";

import PageHero from "../../components/common/PageHero";
import PaymentSelector from "../../components/payments/PaymentSelector";
import CreditCardForm from "../../components/payments/CreditCardForm";
import PaypalForm from "../../components/payments/PaypalForm";
import EsewaForm from "../../components/payments/EsewaForm";
import KhaltiForm from "../../components/payments/KhaltiForm";
import BankTransferForm from "../../components/payments/BankTransferForm";
import CashOnDeliveryForm from "../../components/payments/CashOnDeliveryForm";
import OrderSummary from "../../components/payments/OrderSummary";
import OrderTimeline from "../../components/payments/OrderTimeline";
import DeliveryPartnerCard from "../../components/payments/DeliveryPartnerCard";
import OrderReceipt from "../../components/payments/OrderReceipt";
import {
  CustomerNotificationModal,
  DeliveryPartnerNotificationModal,
} from "../../components/payments/NotificationPreview";

import { HERO_IMAGES } from "../../data/imagePaths";
import { useCart } from "../../context/CartContext";

function Checkout() {
  const { items, rentalSubtotal, deposits, clearCart } = useCart();

  // Modal payment flow state
  // null | "selector" | "form"
  const [paymentModalState, setPaymentModalState] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("Credit / Debit Card");

  // Delivery & Schedule state
  const [deliveryFee, setDeliveryFee] = useState(100);
  const [pickupDate, setPickupDate] = useState("2026-09-18");
  const [returnDate, setReturnDate] = useState("2026-09-25");
  const durationDays = 7;
  const [voucher, setVoucher] = useState(null);

  // Customer basic info (empty strings with clean placeholders so user doesn't have to backspace prefilled text)
  const [customerInfo, setCustomerInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "Kathmandu",
    province: "Bagmati",
    postalCode: "44600",
    emergencyContact: "",
  });

  // Success & Sub-View State (null | "receipt" | "tracking")
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [activeSuccessView, setActiveSuccessView] = useState("receipt");
  const [showCustomerNotification, setShowCustomerNotification] = useState(false);
  const [showRiderNotification, setShowRiderNotification] = useState(false);

  // Calculate voucher discount
  let voucherDiscount = 0;
  if (voucher) {
    if (voucher.type === "percent") {
      voucherDiscount = Math.round((rentalSubtotal * voucher.value) / 100);
    } else if (voucher.type === "fixed") {
      voucherDiscount = Math.min(voucher.value, rentalSubtotal);
    }
  }

  const payableTotal = Math.max(
    0,
    rentalSubtotal - voucherDiscount + deposits + deliveryFee
  );

  const handleDeliveryZoneChange = (_zoneName, fee) => {
    setDeliveryFee(fee);
  };

  const handleProceedToPayment = () => {
    setPaymentModalState("selector");
  };

  const handleSelectPaymentMethod = (method) => {
    setSelectedMethod(method);
    setPaymentModalState("form");
  };

  const handlePaymentSuccess = (paymentResult) => {
    const finalOrderId =
      paymentResult.orderId || `PK-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalTxnId =
      paymentResult.txnId || `TXN-PK-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderData = {
      orderId: finalOrderId,
      txnId: finalTxnId,
      paymentMethod: paymentResult.method || selectedMethod,
      customerName: paymentResult.customerName || customerInfo.fullName || "Aayush Shrestha",
      phone: paymentResult.phone || customerInfo.phone || "+977-9841234567",
      email: paymentResult.email || customerInfo.email || "aayush.shrestha@example.com",
      pickupDate,
      returnDate,
      durationDays,
      deliveryAddress:
        paymentResult.deliveryAddress ||
        (customerInfo.address
          ? `${customerInfo.address}, ${customerInfo.city} (${customerInfo.postalCode || "44600"})`
          : "House 42, Gairidhara Road, Kathmandu (44600)"),
      items: items.length > 0 ? items : [
        { id: "1", name: "Alpine Trek 45L Pack", brand: "Osprey", category: "Backpacks", condition: "Like new", rentalPrice: 650, quantity: 1, image: "/images/products/backpack1.jpg" },
        { id: "2", name: "Down Ridge Shell Jacket", brand: "Rab", category: "Jackets", condition: "Excellent", rentalPrice: 520, quantity: 1, image: "/images/products/jacket1.jpg" },
      ],
      rentalSubtotal,
      deposits,
      deliveryFee,
      voucherDiscount,
      grandTotal: payableTotal,
      trackingId: "PKDLV-48393",
      riderName: "Suman Gurung",
      instructions: paymentResult.instructions || "Handle gear with care.",
    };

    setPaymentModalState(null);
    setConfirmedOrder(orderData);
    setActiveSuccessView("receipt");
    toast.success("Order confirmed successfully!");
    if (clearCart) clearCart();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // If order is confirmed, render the multi-part order confirmation screen
  if (confirmedOrder) {
    return (
      <main className="bg-[#f9fafb] pb-24">
        {activeSuccessView === "receipt" ? (
          /* PART 1: Order Confirmation & Receipt View */
          <>
            <PageHero
              image={HERO_IMAGES.checkoutBanner}
              breadcrumb="PEAKKIT / ORDER CONFIRMED"
              title="Your Trail Reservation is Confirmed!"
              subtitle={`Order ID: ${confirmedOrder.orderId} · Payment Authorized via ${confirmedOrder.paymentMethod}`}
              primaryButton={{
                text: "Track My Order",
                onClick: () => {
                  setActiveSuccessView("tracking");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                },
              }}
              secondaryButton={{
                text: "View Customer Alerts",
                onClick: () => setShowCustomerNotification(true),
              }}
            />

            <div className="mx-auto max-w-5xl px-5 py-12 lg:px-8 space-y-10">
              {/* 3 Highlight Summary Boxes */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
                  <span className="text-[10px] uppercase font-bold text-emerald-800">
                    Order Status
                  </span>
                  <div className="mt-1 flex items-center gap-2 text-emerald-950 font-bold text-lg">
                    <CheckCircle2 size={20} className="text-emerald-600" />
                    <span>Confirmed</span>
                  </div>
                  <p className="mt-1 text-xs text-emerald-700 font-mono">
                    Txn: {confirmedOrder.txnId}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Payment Method
                  </span>
                  <p className="mt-1 font-display text-lg font-bold text-green-950">
                    {confirmedOrder.paymentMethod}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Grand Total: <b className="text-green-900">Rs. {confirmedOrder.grandTotal.toLocaleString()}</b>
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Handover Timeline
                  </span>
                  <p className="mt-1 font-display text-lg font-bold text-green-950">
                    {confirmedOrder.pickupDate}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Return on {confirmedOrder.returnDate}
                  </p>
                </div>
              </div>

              {/* Multichannel Notification Previews Trigger Card */}
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-stone-50 via-white to-stone-50 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
                      Demo Notifications
                    </span>
                    <h4 className="font-display text-xl font-bold text-green-950">
                      Interactive Multichannel Previews
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Simulated real-time alerts sent to the customer and the delivery partner
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCustomerNotification(true)}
                      className="inline-flex items-center gap-2 rounded-full bg-green-900 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-green-800 transition"
                    >
                      <Bell size={15} /> Customer Alerts (SMS / WhatsApp / Email)
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowRiderNotification(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                    >
                      <Truck size={15} /> Rider Dispatch Alert
                    </button>
                  </div>
                </div>
              </div>

              {/* Itemized Invoice & Equipment Receipt */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-2xl font-bold text-green-950">
                    Itemized Invoice & Equipment Receipt
                  </h3>
                </div>
                <OrderReceipt
                  orderId={confirmedOrder.orderId}
                  txnId={confirmedOrder.txnId}
                  customerName={confirmedOrder.customerName}
                  phone={confirmedOrder.phone}
                  email={confirmedOrder.email}
                  pickupDate={confirmedOrder.pickupDate}
                  returnDate={confirmedOrder.returnDate}
                  items={confirmedOrder.items}
                  rentalSubtotal={confirmedOrder.rentalSubtotal}
                  deposits={confirmedOrder.deposits}
                  deliveryFee={confirmedOrder.deliveryFee}
                  voucherDiscount={confirmedOrder.voucherDiscount}
                  grandTotal={confirmedOrder.grandTotal}
                  paymentMethod={confirmedOrder.paymentMethod}
                  address={confirmedOrder.deliveryAddress}
                />
              </section>

              {/* 3 Action Buttons beneath Receipt */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSuccessView("tracking");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-8 py-4 text-sm font-bold text-green-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-300"
                >
                  <Truck size={18} />
                  <span>Track My Order</span>
                </button>

                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 rounded-full bg-green-900 px-7 py-4 text-sm font-bold text-white shadow-md hover:bg-green-800 transition"
                >
                  <ShoppingBag size={17} />
                  <span>Continue Exploring Gear</span>
                </Link>

                <Link
                  to="/adventure-kit"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-4 text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition"
                >
                  <Compass size={17} />
                  <span>Explore Adventure Kits</span>
                </Link>
              </div>
            </div>
          </>
        ) : (
          /* PART 2: Live Tracking View */
          <>
            <PageHero
              image={HERO_IMAGES.checkoutBanner}
              breadcrumb="PEAKKIT / TRACK ORDER"
              title="Live Order Tracking"
              subtitle={`Tracking ID: ${confirmedOrder.trackingId} · Order Reference: ${confirmedOrder.orderId}`}
              primaryButton={{
                text: "← Back to Order Receipt",
                onClick: () => {
                  setActiveSuccessView("receipt");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                },
              }}
            />

            <div className="mx-auto max-w-5xl px-5 py-12 lg:px-8 space-y-10">
              {/* Delivery Partner Assigned Box */}
              <DeliveryPartnerCard
                riderName={confirmedOrder.riderName}
                trackingId={confirmedOrder.trackingId}
              />

              {/* Live Shipping & Gear Prep Timeline */}
              <OrderTimeline orderId={confirmedOrder.orderId} />

              {/* Buttons beneath tracking boxes */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSuccessView("receipt");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition"
                >
                  <FileText size={17} />
                  <span>Back to Order Receipt</span>
                </button>

                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 rounded-full bg-green-900 px-7 py-3.5 text-sm font-bold text-white shadow-md hover:bg-green-800 transition"
                >
                  <ShoppingBag size={17} />
                  <span>Continue Exploring Gear</span>
                </Link>

                <Link
                  to="/adventure-kit"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition"
                >
                  <Compass size={17} />
                  <span>Explore Adventure Kits</span>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Customer Notification Modal */}
        <CustomerNotificationModal
          isOpen={showCustomerNotification}
          onClose={() => setShowCustomerNotification(false)}
          orderDetails={{
            orderId: confirmedOrder.orderId,
            txnId: confirmedOrder.txnId,
            method: confirmedOrder.paymentMethod,
            amount: confirmedOrder.grandTotal,
            pickupDate: confirmedOrder.pickupDate,
            customerName: confirmedOrder.customerName,
            phone: confirmedOrder.phone,
            email: confirmedOrder.email,
            trackingId: confirmedOrder.trackingId,
            items: confirmedOrder.items,
          }}
        />

        {/* Delivery Partner Dispatch Modal */}
        <DeliveryPartnerNotificationModal
          isOpen={showRiderNotification}
          onClose={() => setShowRiderNotification(false)}
          orderDetails={{
            orderId: confirmedOrder.orderId,
            customerName: confirmedOrder.customerName,
            phone: confirmedOrder.phone,
            deliveryAddress: confirmedOrder.deliveryAddress,
            method: confirmedOrder.paymentMethod,
            amount: confirmedOrder.grandTotal,
            instructions: confirmedOrder.instructions,
            items: confirmedOrder.items,
          }}
        />
      </main>
    );
  }

  return (
    <main className="bg-[#f9fafb] pb-24">
      {/* Adventure Kits Left-Aligned Hero */}
      <PageHero
        image={HERO_IMAGES.checkoutBanner}
        breadcrumb="PEAKKIT / CHECKOUT"
        title="Complete Your Reservation"
        subtitle="Secure your high-altitude trekking gear, verify your delivery timeline, and proceed to payment."
      />

      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Left Column: ONLY Box 1 & Box 2 */}
          <div className="space-y-8">
            {/* Box 1: Contact & Delivery Address Form */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-green-50 text-green-900 font-bold text-xs">
                  1
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-green-950">
                    Contact & Delivery Details
                  </h3>
                  <p className="text-xs text-slate-500">
                    Where and who should we deliver or prepare the gear for?
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerInfo.fullName}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, fullName: e.target.value })
                    }
                    placeholder="e.g. Aayush Shrestha"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-green-800 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, phone: e.target.value })
                    }
                    placeholder="e.g. 98XXXXXXXX"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-green-800 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={customerInfo.email}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, email: e.target.value })
                    }
                    placeholder="e.g. name@example.com"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-green-800 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Emergency Trail Contact
                  </label>
                  <input
                    type="text"
                    value={customerInfo.emergencyContact}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        emergencyContact: e.target.value,
                      })
                    }
                    placeholder="e.g. +977-98XXXXXXXX (Family / Guide)"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-green-800 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Delivery Street Address / Hotel / Landmark
                  </label>
                  <input
                    type="text"
                    required
                    value={customerInfo.address}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, address: e.target.value })
                    }
                    placeholder="e.g. Hotel Thamel Eco, House 42 Gairidhara"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-green-800 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    City
                  </label>
                  <input
                    type="text"
                    value={customerInfo.city}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, city: e.target.value })
                    }
                    placeholder="Kathmandu"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-green-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={customerInfo.postalCode}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        postalCode: e.target.value,
                      })
                    }
                    placeholder="44600"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-green-800"
                  />
                </div>
              </div>
            </section>

            {/* Box 2: Rental Duration & Schedule */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-green-50 text-green-900 font-bold text-xs">
                  2
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-green-950">
                    Rental Duration & Schedule
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dates when gear will be in your care
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Pickup / Handover Date
                  </label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-green-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Return Date
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-green-800"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-stone-50 p-4 border border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-green-900 font-semibold">
                  <CalendarDays size={16} className="text-green-800" />
                  <span>{durationDays}-Day Total Mountain Rental Duration</span>
                </div>
                <span className="text-slate-500">Flexible return policy</span>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Order Summary */}
          <div>
            <OrderSummary
              items={items}
              rentalSubtotal={rentalSubtotal}
              deposits={deposits}
              deliveryFee={deliveryFee}
              pickupDate={pickupDate}
              returnDate={returnDate}
              durationDays={durationDays}
              voucher={voucher}
              onApplyVoucher={(v) => {
                setVoucher(v);
                toast.success(`Voucher code "${v.code}" applied!`);
              }}
              onRemoveVoucher={() => {
                setVoucher(null);
                toast.success("Voucher removed.");
              }}
              onProceedToPayment={handleProceedToPayment}
            />
          </div>
        </div>
      </div>

      {/* POP-UP STEP 1: Payment Gateway Selection Modal */}
      {paymentModalState === "selector" && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-green-950/75 p-4 backdrop-blur-xs">
          <div className="my-8 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Step 1 of 2
                </span>
                <h3 className="font-display text-xl font-bold text-green-950">
                  Choose Payment Method
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setPaymentModalState(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6">
              <PaymentSelector
                selectedMethod={selectedMethod}
                onSelectMethod={handleSelectPaymentMethod}
              />
            </div>
          </div>
        </div>
      )}

      {/* POP-UP STEP 2: Selected Branded Payment Form Modal */}
      {paymentModalState === "form" && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-green-950/75 p-4 backdrop-blur-xs">
          <div className="my-8 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => setPaymentModalState("selector")}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-green-900 transition"
              >
                <ArrowLeft size={16} />
                <span>Change Payment Method</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentModalState(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6">
              {selectedMethod === "Credit / Debit Card" && (
                <CreditCardForm
                  amount={payableTotal}
                  onSuccess={handlePaymentSuccess}
                />
              )}

              {selectedMethod === "PayPal" && (
                <PaypalForm
                  amount={payableTotal}
                  onSuccess={handlePaymentSuccess}
                />
              )}

              {selectedMethod === "eSewa" && (
                <EsewaForm
                  amount={payableTotal}
                  onSuccess={handlePaymentSuccess}
                />
              )}

              {selectedMethod === "Khalti" && (
                <KhaltiForm
                  amount={payableTotal}
                  onSuccess={handlePaymentSuccess}
                />
              )}

              {selectedMethod === "Bank Transfer" && (
                <BankTransferForm
                  amount={payableTotal}
                  onSuccess={handlePaymentSuccess}
                />
              )}

              {selectedMethod === "Cash on Delivery" && (
                <CashOnDeliveryForm
                  amount={payableTotal}
                  onDeliveryChange={handleDeliveryZoneChange}
                  onSuccess={handlePaymentSuccess}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Checkout;
