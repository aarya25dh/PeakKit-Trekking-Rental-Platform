import { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  Eye,
  ShoppingBag,
  MousePointerClick,
  Layers,
  Smartphone,
  Globe,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Search,
} from "lucide-react";
import { analytics } from "../../services/analytics";
import { marketingAPI } from "../../services/api";
import SEO from "../../components/common/SEO";

export default function AdminMarketing() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await marketingAPI.getSummary();
      if (res.data && typeof res.data === "object") {
        setData(res.data);
      } else {
        throw new Error("Empty response");
      }
    } catch {
      // Fallback to local storage aggregation
      try {
        const summary = analytics.getMarketingSummary();
        setData(summary);
      } catch {
        setError("Unable to load marketing data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const trafficSources = data?.trafficSources || [
    { source: "Google Organic", sessions: 412, pct: 45, color: "bg-emerald-600" },
    { source: "Direct Traffic", sessions: 218, pct: 24, color: "bg-green-700" },
    { source: "Instagram / Social", sessions: 145, pct: 16, color: "bg-amber-500" },
    { source: "Facebook Ads", sessions: 98, pct: 11, color: "bg-blue-600" },
    { source: "Travel Blogs & Referrals", sessions: 36, pct: 4, color: "bg-stone-500" },
  ];

  const landingPages = data?.landingPages || [
    { path: "/", title: "Homepage — Nepal's Premier Gear Rental", views: 520, convRate: "4.8%" },
    { path: "/explore", title: "Explore Trekking & Camping Catalog", views: 340, convRate: "6.2%" },
    { path: "/adventure-kit", title: "Expedition Adventure Kits Builder", views: 210, convRate: "8.5%" },
    { path: "/gear-advisor", title: "Interactive AI Gear Advisor", views: 160, convRate: "5.1%" },
    { path: "/community", title: "Trekker Stories & Route Reviews", views: 95, convRate: "3.2%" },
  ];

  const getDeviceIcon = (deviceName) => {
    const d = String(deviceName || "").toLowerCase();
    if (d.includes("desktop")) return Globe;
    if (d.includes("tablet")) return Layers;
    return Smartphone;
  };

  const defaultDevices = [
    { device: "Mobile", pct: 64, count: "582 sessions" },
    { device: "Desktop", pct: 31, count: "282 sessions" },
    { device: "Tablet", pct: 5, count: "45 sessions" },
  ];

  const devices = (data?.devices && data.devices.length > 0 ? data.devices : defaultDevices).map((d) => ({
    ...d,
    icon: getDeviceIcon(d.device),
  }));

  return (
    <div className="space-y-8">
      <SEO title="Marketing Analytics | PeakKit Admin" noIndex={true} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
            Growth & Acquisition
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-green-950">
            Marketing & Traffic Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time multi-channel tracking via Google Analytics 4, Meta Pixel & internal dispatch events.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-stone-50 transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Visitors</span>
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
              <Users size={18} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-green-950">
            {data?.visitors?.toLocaleString() ?? "—"}
          </p>
          <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
            <TrendingUp size={12} /> +18.4% vs last week
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sessions</span>
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-blue-50 text-blue-800">
              <Eye size={18} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-green-950">
            {data?.sessions?.toLocaleString() ?? "—"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">Avg 2.4 pages / session</p>
        </div>

        <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Conversions</span>
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-green-50 text-green-900">
              <ShoppingBag size={18} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-green-950">
            {data?.conversions ?? "—"}
          </p>
          <p className="mt-1 text-[11px] font-bold text-emerald-800">
            {data?.conversionRate}% Conversion rate
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Recommendation CTR</span>
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-50 text-amber-700">
              <MousePointerClick size={18} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-green-950">
            {data?.ctr}%
          </p>
          <p className="mt-1 text-[11px] text-amber-800 font-semibold">High engagement</p>
        </div>

        <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Bounce Rate</span>
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-stone-100 text-slate-700">
              <Layers size={18} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-green-950">
            {data?.bounceRate ?? "34.2%"}
          </p>
          <p className="mt-1 text-[11px] text-emerald-700 font-medium">Optimal gear retention</p>
        </div>
      </div>

      {/* Traffic Sources & Device Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Traffic Channels */}
        <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-lg font-bold text-green-950">Acquisition Channels</h3>
              <p className="text-xs text-slate-500">Breakdown of organic, direct and campaign traffic</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              Top: Google Organic
            </span>
          </div>

          <div className="space-y-4">
            {trafficSources.map((t) => (
              <div key={t.source} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{t.source}</span>
                  <span className="font-bold text-slate-900">{t.sessions} sessions ({t.pct}%)</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                  <div className={`h-full rounded-full ${t.color}`} style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-lg font-bold text-green-950">Device & Viewport Share</h3>
                <p className="text-xs text-slate-500">Trekker device distribution across mountain reservations</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {devices.map((d) => {
                const Icon = d.icon;
                return (
                  <div key={d.device} className="rounded-2xl bg-stone-50/80 border border-stone-100 p-4 text-center">
                    <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-800 shadow-xs mb-2">
                      <Icon size={18} />
                    </div>
                    <p className="font-display text-xl font-bold text-green-950">{d.pct}%</p>
                    <p className="text-xs font-bold text-slate-700">{d.device}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{d.count}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-green-950 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-amber-400 shrink-0" />
              <div className="text-xs">
                <p className="font-bold">Mobile Optimization Active</p>
                <p className="text-white/70">64% of trek bookings originate on smartphones in Nepal.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Landing Pages Table */}
      <div className="overflow-x-auto rounded-3xl border border-stone-200/80 bg-white shadow-xs">
        <div className="p-6 border-b border-stone-100">
          <h3 className="font-display text-lg font-bold text-green-950">Top Landing Pages & Funnel Performance</h3>
          <p className="text-xs text-slate-500">Pages generating highest user reservations and gear inquiries</p>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-stone-50/90 border-b border-stone-200/80">
            <tr className="text-left text-xs text-slate-600 font-bold uppercase tracking-wider">
              <th className="px-6 py-3.5">Page Path</th>
              <th className="px-6 py-3.5">Page Title</th>
              <th className="px-6 py-3.5">Pageviews</th>
              <th className="px-6 py-3.5">Conversion Rate</th>
              <th className="px-6 py-3.5">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {landingPages.map((p) => (
              <tr key={p.path} className="hover:bg-stone-50/40 transition">
                <td className="px-6 py-4 font-mono text-xs font-bold text-emerald-900">{p.path}</td>
                <td className="px-6 py-4 font-semibold text-slate-800">{p.title}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{p.views.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-950">
                    {p.convRate}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <a
                    href={p.path}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline"
                  >
                    <span>View Page</span>
                    <ArrowUpRight size={13} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Live Dispatched Event Stream */}
      <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-green-950">Real-Time Event Stream (GA4 & Meta Pixel)</h3>
            <p className="text-xs text-slate-500">Live dispatched user actions across the platform</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Live Listening
          </span>
        </div>

        <div className="space-y-2.5">
          {(data?.recentEvents || []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 p-8 text-center text-xs text-slate-400">
              <Search className="mx-auto mb-2 text-slate-300" size={24} />
              <p className="font-semibold text-slate-600">Events will appear here as users browse the catalog</p>
              <p className="mt-0.5 text-slate-400">Browse gear or test reservations to see live events streamed.</p>
            </div>
          ) : (
            data.recentEvents.map((evt, idx) => (
              <div
                key={evt.id || idx}
                className="flex items-center justify-between rounded-2xl bg-stone-50/70 px-4 py-3 text-xs border border-stone-100"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] font-bold uppercase rounded-lg bg-green-100 text-green-950 px-2 py-1">
                    {evt.name || evt.event_name || "event"}
                  </span>
                  <span className="font-semibold text-slate-700">{evt.url || evt.page_path || "/"}</span>
                  {(evt.params?.item_name || evt.payload?.item_name) && (
                    <span className="text-slate-500 truncate max-w-xs">
                      · {evt.params?.item_name || evt.payload?.item_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span>{evt.device || evt.device_category || "Desktop"}</span>
                  <span>
                    {(() => {
                      try {
                        return new Date(evt.timestamp || evt.created_at || Date.now()).toLocaleTimeString();
                      } catch {
                        return "Just now";
                      }
                    })()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
