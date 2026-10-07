import { useEffect, useState, useCallback } from "react";
import { adminAPI } from "../../services/api";
import {
  TrendingUp, Package, RotateCcw, Users,
  ShoppingBag, Clock, AlertTriangle, CheckCircle2, RefreshCw,
} from "lucide-react";
import { StatsCardSkeleton } from "../../components/common/Skeleton";
import SEO from "../../components/common/SEO";

function StatCard({ icon: Icon, label, value, sub, color = "green" }) {
  const colorMap = {
    green: "bg-green-100 text-green-900",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    rose: "bg-rose-100 text-rose-600",
    indigo: "bg-indigo-100 text-indigo-600",
    sky: "bg-sky-100 text-sky-600",
  };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorMap[color]}`}>
        <Icon size={21} />
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-900">{value ?? "—"}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-700">{label}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function BarRow({ label, value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 truncate text-xs text-slate-600">{label}</span>
      <div className="flex-1 rounded-full bg-slate-100 h-2 overflow-hidden">
        <div className="h-2 rounded-full bg-green-800 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [topGear, setTopGear] = useState([]);
  const [pendingReturns, setPendingReturns] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashRes, gearRes, returnsRes, revRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getTopRentedGear(),
        adminAPI.getPendingReturns(),
        adminAPI.getMonthlyRevenue(),
      ]);
      setDashboard(dashRes.data);
      const gear = gearRes.data?.top_rented_gear ?? gearRes.data?.results ?? (Array.isArray(gearRes.data) ? gearRes.data : []);
      setTopGear(gear);
      const returns = returnsRes.data?.pending_returns ?? returnsRes.data?.results ?? (Array.isArray(returnsRes.data) ? returnsRes.data : []);
      setPendingReturns(returns);
      const rev = revRes.data?.monthly_revenue ?? revRes.data?.results ?? (Array.isArray(revRes.data) ? revRes.data : []);
      setRevenue(rev);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return (
    <div className="space-y-8 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs" />
        <div className="h-72 rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs" />
      </div>
    </div>
  );

  if (error) return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <p className="text-sm font-semibold text-slate-700">{error}</p>
      <button
        type="button"
        onClick={loadData}
        className="mt-2 flex items-center gap-2 rounded-xl bg-green-900 px-4 py-2 text-xs font-bold text-white hover:bg-green-800 transition"
      >
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );

  const d = dashboard || {};
  const maxGear = topGear.length > 0 ? Math.max(...topGear.map((g) => g.rental_count ?? 0)) : 1;

  return (
    <div className="space-y-8">
      <SEO title="Dashboard | PeakKit Admin" noIndex={true} />
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={TrendingUp} label="Total Revenue" value={d.total_revenue != null ? `Rs ${Number(d.total_revenue).toLocaleString()}` : "—"} sub="All confirmed orders" color="green" />
        <StatCard icon={ShoppingBag} label="Active Rentals" value={d.active_rentals ?? "—"} sub="Orders in progress" color="emerald" />
        <StatCard icon={RotateCcw} label="Pending Returns" value={pendingReturns.length} sub="Overdue returns" color="amber" />
        <StatCard icon={Users} label="Total Customers" value={d.total_customers ?? "—"} sub="Registered accounts" color="indigo" />
        <StatCard icon={Package} label="Gear Listed" value={d.total_gear ?? "—"} sub="Unique gear items" color="sky" />
        <StatCard icon={CheckCircle2} label="Completed Orders" value={d.completed_orders ?? "—"} sub="Returned & closed" color="emerald" />
        <StatCard icon={Clock} label="Processing" value={d.processing_orders ?? "—"} sub="Awaiting dispatch" color="amber" />
        <StatCard icon={AlertTriangle} label="Cancelled" value={d.cancelled_orders ?? "—"} sub="This period" color="rose" />
      </div>

      {/* Top Gear + Pending Returns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-display text-base font-bold text-slate-900">Top Rented Gear</h2>
          {topGear.length === 0 ? (
            <p className="text-sm text-slate-400">No rental data yet.</p>
          ) : (
            <div className="space-y-3.5">
              {topGear.slice(0, 8).map((g) => (
                <BarRow key={g.gear_id || g.id} label={g.name} value={g.rental_count ?? 0} max={maxGear} />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-display text-base font-bold text-slate-900">Pending Returns</h2>
          {pendingReturns.length === 0 ? (
            <p className="text-sm text-slate-400">No overdue returns.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <th className="pb-2 font-semibold">Order ID</th>
                    <th className="pb-2 font-semibold">Customer</th>
                    <th className="pb-2 font-semibold">Return Date</th>
                    <th className="pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pendingReturns.slice(0, 8).map((r) => (
                    <tr key={r.id || r.order_id} className="text-slate-700">
                      <td className="py-2 font-mono text-xs text-green-950">#{r.order_id || r.id}</td>
                      <td className="py-2 text-xs">{r.customer_name || "—"}</td>
                      <td className="py-2 text-xs text-slate-500">{r.return_date ? new Date(r.return_date).toLocaleDateString() : "—"}</td>
                      <td className="py-2">
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">{r.order_status || "pending"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Revenue */}
      {revenue.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-display text-base font-bold text-slate-900">Monthly Revenue</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="pb-2 font-semibold">Month</th>
                  <th className="pb-2 font-semibold">Orders</th>
                  <th className="pb-2 font-semibold">Revenue</th>
                  <th className="pb-2 font-semibold">Bar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {revenue.map((row, i) => {
                  const maxRev = Math.max(...revenue.map((r) => Number(r.revenue || 0)));
                  const pct = maxRev > 0 ? Math.round((Number(row.revenue) / maxRev) * 100) : 0;
                  return (
                    <tr key={i} className="text-slate-700">
                      <td className="py-2">{row.month}</td>
                      <td className="py-2">{row.order_count}</td>
                      <td className="py-2 font-semibold text-green-950">Rs {Number(row.revenue).toLocaleString()}</td>
                      <td className="py-2 w-40">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-green-800" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
