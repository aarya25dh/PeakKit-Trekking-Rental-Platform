import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Flame, Compass, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../cards/ProductCard";
import { recommendationsAPI } from "../../services/api";
import { analytics } from "../../services/analytics";
import { useAuth } from "../../context/AuthContext";

export default function RecommendationsSection() {
  const { user, isAuthenticated } = useAuth();
  const [forYou, setForYou] = useState([]);
  const [trending, setTrending] = useState([]);
  const [activeTab, setActiveTab] = useState("for_you");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const [forYouRes, trendingRes] = await Promise.all([
          recommendationsAPI.getForYou(3),
          recommendationsAPI.getTrending(4),
        ]);
        setForYou(forYouRes.data?.recommendations || []);
        setTrending(trendingRes.data?.recommendations || []);
      } catch (err) {
        console.debug("Failed to load recommendations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, [user, isAuthenticated]);

  const items = activeTab === "for_you" ? forYou : trending;

  const handleRecClick = (item) => {
    analytics.trackRecommendationClick(activeTab, item);
    recommendationsAPI
      .recordEvent(activeTab, item.id || item.gear_id, "click")
      .catch(() => {});
  };

  if (!loading && items.length === 0) return null;

  return (
    <section className="bg-stone-50/60 py-20 border-t border-stone-200/60">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              <Sparkles size={15} />
              <span>Smart Hybrid Recommendation Engine</span>
            </div>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-green-950">
              {isAuthenticated && user
                ? `Curated For ${user.first_name || "Your Trail"}`
                : "Curated Gear Tailored For Your Trail"}
            </h2>
            <p className="mt-2 text-sm text-slate-500 max-w-xl">
              {activeTab === "for_you"
                ? isAuthenticated
                  ? "Personalized by collaborative filtering from your past expeditions and complementary category matches."
                  : "Calibrated to current Himalayan trekking season forecasts and high-demand mountain equipment."
                : "Ranked by highest rental activity and user reservations over the last 30 days."}
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex rounded-full bg-white p-1.5 border border-stone-200 shadow-xs">
            <button
              onClick={() => setActiveTab("for_you")}
              className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition ${
                activeTab === "for_you"
                  ? "bg-green-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-green-950"
              }`}
            >
              <Compass size={14} />
              <span>Recommended For You (3)</span>
            </button>
            <button
              onClick={() => setActiveTab("trending")}
              className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition ${
                activeTab === "trending"
                  ? "bg-green-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-green-950"
              }`}
            >
              <Flame size={14} />
              <span>Trending This Week (4)</span>
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-900" />
            <p className="mt-3 text-xs text-slate-400 font-medium">
              Generating dynamic ML gear recommendations...
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              activeTab === "for_you"
                ? "sm:grid-cols-2 lg:grid-cols-3"
                : "sm:grid-cols-2 lg:grid-cols-4"
            }`}
          >
            {items.map((gear) => (
              <div
                key={gear.id || gear.gear_id}
                onClick={() => handleRecClick(gear)}
              >
                <ProductCard product={gear} />
              </div>
            ))}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-3xl bg-green-950 p-6 sm:p-8 text-white shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-display text-xl font-bold text-white">
              Planning a custom multi-day high-altitude trek?
            </h3>
            <p className="text-xs text-white/70 max-w-md">
              Try our AI Gear Advisor to dynamically compute your pack weight, temperature rating, and cost savings.
            </p>
          </div>
          <Link
            to="/gear-advisor"
            className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-xs font-bold text-green-950 hover:bg-amber-300 transition shadow-md shrink-0"
          >
            <span>Launch AI Gear Advisor</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
