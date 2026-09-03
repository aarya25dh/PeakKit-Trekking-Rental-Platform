import { CheckCircle2, RotateCcw, Sparkles, Wrench } from "lucide-react";

function SustainabilitySection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-stone-50/50 via-white to-stone-50/30 py-24">
      {/* Subtle ambient lighting */}
      <div className="pointer-events-none absolute -left-32 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-emerald-100/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-amber-100/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800 border border-emerald-200/60 shadow-2xs">
              <Sparkles size={14} className="text-emerald-600" />
              <span>A better gear lifecycle</span>
            </div>

            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-green-950 leading-tight">
              Rent more. <br />
              <span className="text-emerald-800">Waste less.</span>
            </h2>

            <p className="text-base leading-relaxed text-slate-600 max-w-lg">
              Outdoor gear should spend its life outside, not at the back of a cupboard. We help quality equipment move from one adventure to the next across Nepal's mountains.
            </p>

            {/* Aesthetic Unified Stepper Ribbon */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-1.5 sm:gap-3 rounded-full bg-slate-900/[0.04] p-1.5 border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-green-950 shadow-xs border border-slate-200/50">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    1
                  </span>
                  <span>Rent</span>
                </div>

                <span className="text-slate-400 font-bold text-xs">→</span>

                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-green-950 shadow-xs border border-slate-200/50">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    2
                  </span>
                  <span>Return</span>
                </div>

                <span className="text-slate-400 font-bold text-xs">→</span>

                <div className="flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-xs font-bold text-green-950 shadow-xs">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-950 text-amber-300 text-[10px] font-bold">
                    3
                  </span>
                  <span>Reuse</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bento Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Card 1: Maintained */}
            <div className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:scale-105 border border-emerald-100">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-green-950">
                Professionally maintained
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Every return is cleaned, checked, and repaired before the next booking by certified gear technicians.
              </p>
            </div>

            {/* Card 2: Built to Last */}
            <div className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-amber-300 hover:shadow-md">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700 transition group-hover:scale-105 border border-amber-100">
                <Wrench size={24} />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-green-950">
                Built to last
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                We prioritize durable, weather-tested equipment from premier brands that can withstand Nepal's unpredictable trails.
              </p>
            </div>

            {/* Card 3: 3.2x Stat Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-950 via-[#1a382b] to-green-950 p-7 text-white shadow-lg sm:col-span-2 border border-emerald-800/40">
              <div className="pointer-events-none absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-emerald-500/10 blur-2xl" />

              <div className="flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-amber-300 backdrop-blur-xs border border-white/10">
                  <RotateCcw size={22} />
                </div>
                <span className="rounded-full bg-amber-400/20 px-3 py-1 text-[11px] font-bold text-amber-300 border border-amber-400/30">
                  Eco-Impact Metric
                </span>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <strong className="font-display text-4xl sm:text-5xl font-bold text-amber-300">
                    3.2×
                  </strong>
                  <p className="mt-1 text-sm font-semibold text-white/90">
                    more adventures per item
                  </p>
                </div>
                <p className="max-w-xs text-xs sm:text-right leading-relaxed text-white/70">
                  Small choices add up when a whole outdoor community shares quality gear instead of letting it sit idle in closets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SustainabilitySection;
