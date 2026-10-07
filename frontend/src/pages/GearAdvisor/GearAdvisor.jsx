import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Backpack,
  Check,
  CloudSun,
  Compass,
  CookingPot,
  Droplets,
  Heart,
  Loader2,
  Mountain,
  Navigation,
  ShieldCheck,
  Sparkles,
  TentTree,
  ThermometerSun,
  Weight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import SEO from "../../components/common/SEO";
import { recommendationsAPI } from "../../services/api";
import { useCart } from "../../context/CartContext";
import toast from "react-hot-toast";

const steps = [
  {
    key: "destination",
    title: "Where are you headed?",
    helper: "Your destination shapes the kit, weather guidance, and altitude advice.",
    options: [
      "Everest Base Camp",
      "Annapurna Base Camp",
      "Langtang Valley",
      "Mardi Himal",
      "Ama Yangri",
      "Manaslu Circuit",
      "Upper Mustang",
      "Gosaikunda",
      "Custom Trek",
    ],
  },
  {
    key: "activity",
    title: "What kind of adventure is it?",
    helper: "Tell us how you will spend your days outside.",
    options: [
      "Trekking",
      "Hiking",
      "Camping",
      "Photography Expedition",
      "Snow Trek",
    ],
  },
  {
    key: "experience",
    title: "How much trail experience do you have?",
    helper: "We use this to balance comfort, safety, and simplicity.",
    options: ["Beginner", "Intermediate", "Advanced"],
  },
  {
    key: "duration",
    title: "How long will you be out?",
    helper: "Your rental duration helps us plan practical quantities.",
    options: ["1–3 Days", "4–7 Days", "8–12 Days", "13+ Days"],
  },
  {
    key: "season",
    title: "When are you going?",
    helper: "Nepal changes character with every season.",
    options: ["Spring", "Summer", "Autumn", "Winter"],
  },
  {
    key: "budget",
    title: "What is your gear budget?",
    helper: "Set a daily-ready kit budget. You can always customize later.",
    type: "range",
  },
  {
    key: "accommodation",
    title: "Where will you sleep?",
    helper: "We will adjust your camping and sleep system around this.",
    options: ["Tea House", "Camping", "Mixed"],
  },
  {
    key: "warmth",
    title: "How warm do you like to sleep?",
    helper: "There is no wrong answer, especially above 3,000 metres.",
    options: ["Cold Sleeper", "Normal", "Warm Sleeper"],
  },
  {
    key: "weight",
    title: "How should your pack feel?",
    helper: "Choose the trade-off that feels right for your body and route.",
    options: ["Ultralight", "Balanced", "Maximum Comfort"],
  },
  {
    key: "extras",
    title: "What should we add to your kit?",
    helper: "Select everything you would like us to consider.",
    options: [
      "Cooking Kit",
      "Trekking Poles",
      "Headlamp",
      "Power Bank",
      "Rain Cover",
      "First Aid Kit",
      "Camera Bag",
      "Women's Gear",
    ],
    multi: true,
  },
];

const GROUP_ICONS = {
  Backpack,
  ThermometerSun,
  ShieldCheck,
  TentTree,
  Sparkles,
  CookingPot,
  Droplets,
  Navigation,
};

function GearAdvisor() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({ budget: 9000, extras: [] });
  const [recommendationResult, setRecommendationResult] = useState(null);
  const [loadingResult, setLoadingResult] = useState(false);

  const current = steps[stepIndex];
  const finished = stepIndex === steps.length;

  const setAnswer = (value) =>
    setAnswers((previous) => ({ ...previous, [current.key]: value }));

  const next = () => {
    if (stepIndex < steps.length) setStepIndex((value) => value + 1);
  };

  const previous = () => setStepIndex((value) => Math.max(0, value - 1));

  const restart = () => {
    setAnswers({ budget: 9000, extras: [] });
    setRecommendationResult(null);
    setStepIndex(0);
  };

  // Solve gear recommendation dynamically from backend on completion
  useEffect(() => {
    if (finished) {
      setLoadingResult(true);
      recommendationsAPI
        .solveGearAdvisor(answers)
        .then((res) => {
          setRecommendationResult(res.data);
        })
        .catch((err) => {
          console.error("Gear Advisor solve error:", err);
        })
        .finally(() => {
          setLoadingResult(false);
        });
    }
  }, [finished, answers]);

  return (
    <main className="min-h-screen bg-[#f3f4f1] px-5 py-10 lg:px-8">
      <SEO
        title="Gear Advisor — Interactive AI Trek Packing Tool"
        description="Answer quick trail questions to get a personalized trekking and camping gear bundle calibrated for Nepal's elevation, route conditions, and weather."
        canonical="/gear-advisor"
      />
      <div className="mx-auto max-w-6xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-900"
        >
          <ArrowLeft size={16} /> Back to home
        </Link>
        {finished ? (
          <Result
            answers={answers}
            result={recommendationResult}
            loading={loadingResult}
            restart={restart}
          />
        ) : (
          <div className="mt-9 grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <aside className="rounded-[2rem] bg-green-950 p-7 text-white sm:p-10">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400 text-green-950">
                <Compass />
              </span>
              <p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                Smart Gear Advisor
              </p>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">
                Personalized packing for your trail.
              </h1>
              <p className="mt-5 leading-7 text-white/65">
                Answer ten quick questions and get a personal kit built around
                your route, altitude, comfort level, and the current Himalayan season.
              </p>
              <div className="mt-12 hidden rounded-2xl border border-white/15 bg-white/5 p-5 lg:block">
                <Mountain className="text-amber-300" />
                <p className="mt-4 text-sm font-semibold">
                  Zero guesswork on the mountain.
                </p>
                <p className="mt-2 text-xs leading-5 text-white/55">
                  Every recommendation is tuned by elevation models and weather history.
                </p>
              </div>
            </aside>
            <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">
                  Question {stepIndex + 1} of {steps.length}
                </span>
                <span className="text-sm font-bold text-green-900">
                  {Math.round((stepIndex / steps.length) * 100)}%
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
                <motion.div
                  animate={{ width: `${(stepIndex / steps.length) * 100}%` }}
                  className="h-full rounded-full bg-amber-400"
                />
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.key}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.22 }}
                  className="mt-10"
                >
                  <h2 className="font-display text-3xl font-semibold text-green-950 sm:text-4xl">
                    {current.title}
                  </h2>
                  <p className="mt-3 max-w-xl leading-7 text-slate-500">
                    {current.helper}
                  </p>
                  {current.type === "range" ? (
                    <BudgetInput
                      value={answers.budget}
                      onChange={setAnswer}
                    />
                  ) : (
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      {current.options.map((option) => (
                        <Option
                          key={option}
                          option={option}
                          selected={
                            current.multi
                              ? answers.extras.includes(option)
                              : answers[current.key] === option
                          }
                          onClick={() =>
                            current.multi
                              ? setAnswer(
                                  answers.extras.includes(option)
                                    ? answers.extras.filter(
                                        (item) => item !== option
                                      )
                                    : [...answers.extras, option]
                                )
                              : setAnswer(option)
                          }
                          multi={current.multi}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-6">
                <button
                  onClick={previous}
                  disabled={stepIndex === 0}
                  className="flex items-center gap-2 text-sm font-bold text-slate-500 disabled:opacity-30"
                >
                  <ArrowLeft size={16} /> Previous
                </button>
                <button
                  onClick={next}
                  className="flex items-center gap-2 rounded-full bg-green-900 px-5 py-3 text-sm font-bold text-white hover:bg-green-800"
                >
                  {stepIndex === steps.length - 1
                    ? "Build my AI kit"
                    : "Next question"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function Option({ option, selected, onClick, multi }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between rounded-2xl border p-4 text-left text-sm font-semibold transition ${
        selected
          ? "border-green-900 bg-green-50 text-green-900"
          : "border-slate-200 text-slate-700 hover:border-green-700 hover:bg-green-50/50"
      }`}
    >
      <span>{option}</span>
      {selected ? (
        <span className="grid h-6 w-6 place-items-center rounded-full bg-green-900 text-white">
          <Check size={14} />
        </span>
      ) : (
        <span
          className={`h-5 w-5 rounded-${
            multi ? "md" : "full"
          } border border-slate-300`}
        />
      )}
    </button>
  );
}

function BudgetInput({ value, onChange }) {
  return (
    <div className="mt-10 rounded-2xl bg-green-50 p-6">
      <div className="flex items-end justify-between">
        <span className="text-sm font-semibold text-slate-600">
          Estimated kit budget
        </span>
        <strong className="font-display text-3xl text-green-900">
          Rs. {Number(value).toLocaleString()}
        </strong>
      </div>
      <input
        aria-label="Gear budget"
        type="range"
        min="2000"
        max="25000"
        step="500"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-8 w-full accent-green-900"
      />
      <div className="mt-2 flex justify-between text-xs font-semibold text-slate-500">
        <span>Rs. 2,000</span>
        <span>Rs. 25,000</span>
      </div>
    </div>
  );
}

function Result({ answers, result, loading, restart }) {
  const { addItem } = useCart();
  const navigate = useNavigate();

  if (loading || !result) {
    return (
      <div className="mt-16 flex flex-col items-center justify-center p-12 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-900" />
        <h2 className="mt-4 font-display text-2xl font-bold text-green-950">
          Calibrating Expedition Equipment...
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Matching elevation profiles, temperature forecasts, and pack weights from database.
        </p>
      </div>
    );
  }

  const { destination_metadata: meta, confidence_score, metrics, groups } = result;

  const handleRentEntireKit = () => {
    let count = 0;
    groups.forEach((g) => {
      g.items.forEach((item) => {
        addItem({
          id: item.id,
          name: item.name,
          rentalPrice: item.price_per_day,
          price: item.price,
          image: item.image,
          category: item.category,
        });
        count++;
      });
    });
    toast.success(`Added ${count} items to your cart!`);
    navigate("/cart");
  };

  return (
    <div className="mt-8">
      {/* Overview Banner */}
      <div className="overflow-hidden rounded-[2rem] bg-green-950 p-7 text-white sm:p-12">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
              Your Personalized Adventure Kit
            </p>
            <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold sm:text-6xl">
              Ready for {answers.destination || "the high trail"}.
            </h1>
            <p className="mt-5 max-w-xl leading-7 text-white/65">
              A {answers.weight?.toLowerCase() || "balanced"} setup for a{" "}
              {answers.activity?.toLowerCase() || "trek"}, calibrated to your comfort and trail demands.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 text-center backdrop-blur-xs">
            <strong className="block font-display text-5xl text-amber-300">
              {confidence_score}%
            </strong>
            <span className="text-xs font-bold uppercase tracking-wider text-white/65">
              AI Match Score
            </span>
          </div>
        </div>

        {/* Trail Stats Bar */}
        <div className="mt-10 grid gap-3 sm:grid-cols-4">
          {[
            [CloudSun, "Trail Conditions", meta.weather],
            [ThermometerSun, "Temperature Range", meta.temp],
            [Mountain, "Trail Difficulty", meta.difficulty],
            [Navigation, "Max Elevation", meta.elevation],
          ].map(([Icon, label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-white/15 bg-white/5 p-4 backdrop-blur-xs"
            >
              <Icon size={19} className="text-amber-300" />
              <span className="mt-4 block text-xs text-white/50">{label}</span>
              <strong className="mt-1 block text-sm font-semibold">{value}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing and Weight Bar */}
      <div className="mt-10 flex flex-wrap items-end justify-between gap-5 border-b border-stone-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            <Weight size={15} />
            <span>Estimated Total Pack Weight: {metrics.total_weight_kg} kg</span>
          </div>
          <h2 className="mt-2 font-display text-3xl font-semibold text-green-950">
            Recommended Expedition Equipment
          </h2>
        </div>
        <div className="text-right">
          <span className="block text-sm text-slate-500">
            Estimated {metrics.duration_days}-day rental
          </span>
          <strong className="font-display text-3xl text-green-900">
            NPR {metrics.estimated_trip_rental?.toLocaleString()}
          </strong>
          <span className="block text-xs font-semibold text-emerald-700">
            Save NPR {metrics.total_savings?.toLocaleString()} vs buying new
          </span>
        </div>
      </div>

      {/* Dynamic Item Groups */}
      <div className="mt-8 space-y-8">
        {groups.map((group) => {
          const IconComp = GROUP_ICONS[group.icon] || Backpack;
          if (!group.items || group.items.length === 0) return null;
          return (
            <section key={group.name}>
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-green-900">
                <IconComp size={18} /> {group.name} ({group.items.length} items)
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {group.items.map((item) => (
                  <article
                    key={item.id}
                    className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-green-800/40 hover:shadow-md"
                  >
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.opacity = "0";
                        }}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-display text-sm font-bold text-slate-900">
                          {item.name}
                        </h3>
                        <span className="text-xs font-bold text-green-900 shrink-0 ml-2">
                          {item.price} / day
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        {item.reason}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Weight: ~{item.weight_kg} kg</span>
                        <Link
                          to={`/product/${item.id}`}
                          className="font-bold text-green-800 hover:underline"
                        >
                          View details →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-12 flex flex-wrap items-center gap-3">
        <button
          onClick={handleRentEntireKit}
          className="rounded-full bg-green-900 px-7 py-3.5 text-sm font-bold text-white shadow-md hover:bg-green-800 transition"
        >
          Rent Entire AI Kit ({metrics.groups?.reduce((acc, g) => acc + g.items.length, 0) || "All"} items)
        </button>
        <Link
          to="/explore"
          className="rounded-full border border-green-900 bg-white px-7 py-3.5 text-sm font-bold text-green-900 hover:bg-green-50 transition"
        >
          Customize in Marketplace
        </Link>
        <button
          onClick={restart}
          className="rounded-full px-5 py-3.5 text-sm font-semibold text-slate-500 hover:text-green-900 transition"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}

export default GearAdvisor;
