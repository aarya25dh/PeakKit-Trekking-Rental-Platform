import { useEffect, useState, useCallback } from "react";
import { adminAPI } from "../../services/api";
import { Search, RefreshCw, AlertTriangle, CalendarCheck } from "lucide-react";
import { TableRowSkeleton } from "../../components/common/Skeleton";
import SEO from "../../components/common/SEO";

const STATUS_COLORS = {
  confirmed: "bg-emerald-100 text-emerald-700",
  Active: "bg-emerald-100 text-emerald-700",
  Upcoming: "bg-blue-100 text-blue-700",
  Completed: "bg-slate-100 text-slate-600",
  Cancelled: "bg-rose-100 text-rose-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getReservations();
      // Backend: { count, reservations: [...] }
      const data = res.data?.reservations ?? (Array.isArray(res.data) ? res.data : []);
      setReservations(data);
      setFiltered(data);
    } catch {
      setError("Failed to load reservations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let result = reservations;
    if (statusFilter !== "all") result = result.filter((r) => r.reservation_status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) =>
        (r.gear_name || r.gear || "").toLowerCase().includes(q) ||
        (r.order_id || "").toString().includes(q)
      );
    }
    setFiltered(result);
  }, [reservations, search, statusFilter]);

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

  // Group by gear for the default view
  const grouped = {};
  reservations.forEach((r) => {
    const gearName = r.gear_name || r.gear || "Unknown Gear";
    if (!grouped[gearName]) grouped[gearName] = [];
    grouped[gearName].push(r);
  });

  return (
    <div className="space-y-6">
      <SEO title="Reservations Calendar | PeakKit Admin" noIndex={true} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search gear or order ID…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all","Active","Upcoming","Completed","Cancelled"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase transition ${statusFilter === s ? "bg-green-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-stone-50 hover:text-green-950"}`}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={load} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"><RefreshCw size={15} /></button>
      </div>

      {/* Grouped gear view (default) */}
      {statusFilter === "all" && search === "" ? (
        <div className="space-y-5">
          {Object.entries(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white py-16 text-center shadow-sm">
              <CalendarCheck className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm text-slate-400">No reservations found.</p>
            </div>
          ) : Object.entries(grouped).map(([gearName, rsvs]) => (
            <div key={gearName} className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <CalendarCheck size={16} className="text-green-800" />
                <span className="font-display font-bold text-slate-800">{gearName}</span>
                <span className="ml-auto rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-bold text-green-950">{rsvs.length} reservations</span>
              </div>
              <div className="divide-y divide-slate-50">
                {rsvs.map((r, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-[160px]">
                      <p className="text-sm font-semibold text-slate-800">{r.customer_email || "—"}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{r.rental_start_date ? new Date(r.rental_start_date).toLocaleDateString() : "—"}</span>
                      <span className="text-slate-300">→</span>
                      <span>{r.rental_end_date ? new Date(r.rental_end_date).toLocaleDateString() : "—"}</span>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_COLORS[r.reservation_status] || "bg-slate-100 text-slate-500"}`}>
                      {r.reservation_status || "—"}
                    </span>
                    <span className="font-mono text-xs text-slate-400">Order #{r.order_id}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Filtered table */
        <div className="overflow-x-auto rounded-3xl border border-stone-200/80 bg-white shadow-xs max-h-[620px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-xs border-b border-stone-200/80">
              <tr className="text-left text-xs text-slate-600 font-bold uppercase tracking-wider">
                <th className="px-4 py-3.5">Gear</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Start</th>
                <th className="px-4 py-3.5">End</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={6} />
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                    <p className="font-semibold text-slate-600">No reservations found</p>
                    <p className="text-xs text-slate-400 mt-1">Change search filter or date ranges.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={i} className="hover:bg-stone-50/20 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.gear_name || r.gear || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{r.customer_email || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{r.rental_start_date ? new Date(r.rental_start_date).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{r.rental_end_date ? new Date(r.rental_end_date).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_COLORS[r.reservation_status] || "bg-slate-100 text-slate-500"}`}>
                        {r.reservation_status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-green-950">#{r.order_id}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-slate-400">{filtered.length} reservation(s)</p>
    </div>
  );
}
