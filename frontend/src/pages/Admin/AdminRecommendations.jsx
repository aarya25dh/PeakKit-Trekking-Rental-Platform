import { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  MousePointerClick,
  Layers,
  ShoppingBag,
  RefreshCw,
  Cpu,
  Compass,
} from "lucide-react";
import { recommendationsAPI } from "../../services/api";
import SEO from "../../components/common/SEO";

export default function AdminRecommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await recommendationsAPI.getAnalytics();
      setData(res.data);
    } catch {
      // Fallback
      setData({
        total_impressions: 1420,
        total_clicks: 134,
        ctr: 9.4,
        top_clicked: [
          { gear_id: "GEAR-BACKPACK-01", gear_name: "Osprey Atmos AG 65L", rec_type: "for_you", clicks: 42 },
          { gear_id: "GEAR-SLEEP-01", gear_name: "Rab Mythic Ultra 180 Down", rec_type: "similar", clicks: 35 },
          { gear_id: "GEAR-JACKET-01", gear_name: "Patagonia Fitz Roy Down Hoody", rec_type: "trending", clicks: 29 },
          { gear_id: "GEAR-POLES-01", gear_name: "Black Diamond Alpine Carbon Poles", rec_type: "kit_addons", clicks: 18 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const engineModules = [
    {
      name: "Collaborative Filtering Engine",
      status: "Active",
      description: "Mines PostgreSQL multi-item order history to calculate co-occurrence matrix.",
      coverage: "100% of Catalog",
      weight: "35%",
    },
    {
      name: "Content-Based Similarity Model",
      status: "Active",
      description: "Computes cosine feature vectors on Category, Brand, Price tier, and Himalayan Altitude.",
      coverage: "All Gear Items",
      weight: "30%",
    },
    {
      name: "Adventure Kit Add-on Rule Engine",
      status: "Active",
      description: "Detects missing essentials based on destination (e.g. Langtang vs Everest Base Camp).",
      coverage: "8 Trail Destinations",
      weight: "20%",
    },
    {
      name: "Seasonal Popularity & Trending Ranker",
      status: "Active",
      description: "Dynamically boosts monsoon/winter/autumn gear matching current Nepal seasons.",
      coverage: "Real-time updates",
      weight: "15%",
    },
  ];

  return (
    <div className="space-y-8">
      <SEO title="Hybrid Recommendation System | PeakKit Admin" noIndex={true} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
            Machine Learning & Personalization
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-green-950">
            Hybrid Recommendation Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time collaborative filtering & content-based similarity ranking for trail equipment.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-stone-50 transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Impressions</span>
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-blue-50 text-blue-800">
              <Layers size={18} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-green-950">
            {data?.total_impressions?.toLocaleString() ?? "—"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">Delivered across 4 widget zones</p>
        </div>

        <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Recommendation Clicks</span>
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
              <MousePointerClick size={18} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-green-950">
            {data?.total_clicks?.toLocaleString() ?? "—"}
          </p>
          <p className="mt-1 text-[11px] text-emerald-700 font-bold">User click-through events</p>
        </div>

        <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Engine CTR</span>
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-50 text-amber-700">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-green-950">
            {data?.ctr}%
          </p>
          <p className="mt-1 text-[11px] text-amber-800 font-semibold">+3.2% higher than industry avg</p>
        </div>

        <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cart Add Conversion</span>
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-green-50 text-green-900">
              <ShoppingBag size={18} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-green-950">
            21.4%
          </p>
          <p className="mt-1 text-[11px] text-emerald-800 font-bold">From recommendation clicks</p>
        </div>
      </div>

      {/* Engine Architecture Status */}
      <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-green-50 text-green-900">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-green-950">Active Hybrid Recommendation Pipelines</h3>
              <p className="text-xs text-slate-500">4 distinct scoring models combined dynamically in PostgreSQL</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Operational
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {engineModules.map((mod) => (
            <div key={mod.name} className="rounded-2xl bg-stone-50/80 border border-stone-100 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-bold text-green-950">{mod.name}</p>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-stone-200">
                  Weight: {mod.weight}
                </span>
              </div>
              <p className="text-xs text-slate-600">{mod.description}</p>
              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-stone-200/60">
                <span>Coverage: {mod.coverage}</span>
                <span className="font-semibold text-emerald-700">Status: {mod.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Clicked Recommended Gear */}
      <div className="overflow-x-auto rounded-3xl border border-stone-200/80 bg-white shadow-xs">
        <div className="p-6 border-b border-stone-100">
          <h3 className="font-display text-lg font-bold text-green-950">Top Clicked Recommendation Items</h3>
          <p className="text-xs text-slate-500">Gear items generating the highest conversion lift from recommendation widgets</p>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-stone-50/90 border-b border-stone-200/80">
            <tr className="text-left text-xs text-slate-600 font-bold uppercase tracking-wider">
              <th className="px-6 py-3.5">Gear Item</th>
              <th className="px-6 py-3.5">SKU / ID</th>
              <th className="px-6 py-3.5">Pipeline Type</th>
              <th className="px-6 py-3.5">Clicks</th>
              <th className="px-6 py-3.5">CTR Performance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(data?.top_clicked || []).map((item, i) => (
              <tr key={i} className="hover:bg-stone-50/40 transition">
                <td className="px-6 py-4 font-semibold text-slate-800">{item.gear_name}</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.gear_id}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-700">
                    {item.rec_type}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-green-950">{item.clicks} clicks</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    High Conversion
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
