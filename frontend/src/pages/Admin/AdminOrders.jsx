import { useEffect, useState, useCallback } from "react";
import { ordersAPI } from "../../services/api";
import { Search, ChevronRight, X, RefreshCw, Clock, CheckCircle2, Truck, RotateCcw, XCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { TableRowSkeleton } from "../../components/common/Skeleton";
import SEO from "../../components/common/SEO";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-indigo-100 text-indigo-700",
  shipped: "bg-cyan-100 text-cyan-700",
  out_for_delivery: "bg-green-100 text-green-950",
  delivered: "bg-emerald-100 text-emerald-700",
  returned: "bg-slate-100 text-slate-600",
  cancelled: "bg-rose-100 text-rose-700",
};

const ALL_STATUSES = ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "returned", "cancelled"];

function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${cls}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="w-24 shrink-0 text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-xs text-slate-800 break-all">{value}</span>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getAll();
      // Backend returns {orders: [...]} for admin users
      const data = res.data?.orders ?? (Array.isArray(res.data) ? res.data : []);
      setOrders(data);
      setFiltered(data);
    } catch {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let result = orders;
    if (statusFilter !== "all") result = result.filter((o) => o.order_status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((o) =>
        String(o.order_id || o.id).toLowerCase().includes(q) ||
        (o.customer_name || "").toLowerCase().includes(q) ||
        (o.destination || "").toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [orders, search, statusFilter]);

  const openDrawer = async (order) => {
    setSelected(order);
    setTracking([]);
    try {
      const res = await ordersAPI.getTracking(order.order_id || order.id);
      // TrackingEvent has: title, description, timestamp, completed
      const events = res.data?.tracking_events ?? res.data?.events ?? (Array.isArray(res.data) ? res.data : []);
      setTracking(events);
    } catch { /* no tracking yet */ }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selected) return;
    setUpdatingStatus(newStatus);
    try {
      await ordersAPI.updateStatus(selected.order_id || selected.id, newStatus);
      toast.success(`Order ${selected.order_id} → ${newStatus.replace(/_/g, " ")}`);
      setSelected((prev) => ({ ...prev, order_status: newStatus }));
      setOrders((prev) => prev.map((o) =>
        (o.order_id === selected.order_id) ? { ...o, order_status: newStatus } : o
      ));
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setUpdatingStatus("");
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-green-900 border-t-transparent" />
    </div>
  );

  if (error) return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <p className="text-sm font-semibold text-slate-700">{error}</p>
      <button onClick={load} className="rounded-xl bg-green-900 px-4 py-2 text-xs font-bold text-white">Retry</button>
    </div>
  );

  return (
    <div className="flex gap-6 relative">
      <SEO title="Order Management | PeakKit Admin" noIndex={true} />
      {/* Orders table */}
      <div className={`flex flex-col flex-1 min-w-0 ${selected ? "lg:max-w-[calc(100%-400px)]" : ""}`}>
        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search order ID, customer, destination…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["all", ...ALL_STATUSES].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase transition ${statusFilter === s ? "bg-green-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-stone-50 hover:text-green-950"}`}>
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
          <button onClick={load} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"><RefreshCw size={15} /></button>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-stone-200/80 bg-white shadow-xs max-h-[620px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-xs border-b border-stone-200/80">
              <tr className="text-left text-xs text-slate-600 font-bold uppercase tracking-wider">
                <th className="px-4 py-3.5">Order ID</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Destination</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Dates</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={7} />
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                    <p className="font-semibold text-slate-600">No orders found</p>
                    <p className="text-xs text-slate-400 mt-1">Try changing your search terms or status filter.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.order_id || order.id}
                    className={`cursor-pointer transition hover:bg-stone-50/40 ${selected?.order_id === order.order_id ? "bg-stone-50" : ""}`}
                    onClick={() => openDrawer(order)}>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-green-950">{order.order_id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{order.customer_name || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{order.destination || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {order.total_amount != null ? `Rs ${Number(order.total_amount).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div>{order.rental_start_date ? new Date(order.rental_start_date).toLocaleDateString() : "—"}</div>
                      <div className="text-slate-400">→ {order.rental_end_date ? new Date(order.rental_end_date).toLocaleDateString() : "—"}</div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={order.order_status} /></td>
                    <td className="px-4 py-3"><ChevronRight size={16} className="text-slate-300" /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-400">{filtered.length} order(s)</p>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="hidden lg:flex flex-col w-[380px] shrink-0 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden max-h-[calc(100vh-10rem)]">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div>
              <p className="font-mono text-xs text-green-900">{selected.order_id}</p>
              <p className="font-display text-base font-bold text-slate-900">{selected.customer_name}</p>
            </div>
            <button onClick={() => setSelected(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div className="space-y-2">
              <Row label="Destination" value={selected.destination || "—"} />
              <Row label="Start" value={selected.rental_start_date ? new Date(selected.rental_start_date).toLocaleDateString() : "—"} />
              <Row label="Return" value={selected.return_date ? new Date(selected.return_date).toLocaleDateString() : "—"} />
              <Row label="Days" value={selected.rental_days ?? "—"} />
              <Row label="Amount" value={`Rs ${Number(selected.total_amount || 0).toLocaleString()}`} />
              <Row label="Payment" value={selected.payment_status || "—"} />
              <Row label="Partner" value={selected.delivery_partner_name || "—"} />
            </div>

            {/* Status Update */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-slate-500">Update Status</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_STATUSES.map((s) => (
                  <button key={s} onClick={() => handleStatusUpdate(s)} disabled={selected.order_status === s || !!updatingStatus}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase transition ${selected.order_status === s ? "bg-green-900 text-white cursor-default" : "bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-950 disabled:opacity-50"}`}>
                    {updatingStatus === s ? "…" : s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Tracking Timeline */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase text-slate-500">Tracking Timeline</p>
              {tracking.length === 0 ? (
                <p className="text-xs text-slate-400">No tracking events yet.</p>
              ) : (
                <ol className="relative border-l-2 border-stone-200 space-y-4 ml-2">
                  {tracking.map((event, i) => (
                    <li key={i} className="ml-4">
                      <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-green-900 ring-2 ring-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                      <p className="text-xs font-bold text-slate-800">{event.title || event.status}</p>
                      <p className="text-xs text-slate-500">{event.description}</p>
                      <p className="text-[10px] text-slate-400">{event.timestamp ? new Date(event.timestamp).toLocaleString() : ""}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
