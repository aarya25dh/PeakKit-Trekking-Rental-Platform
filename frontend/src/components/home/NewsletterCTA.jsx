import { ArrowUpRight, Mail } from "lucide-react";

function NewsletterCTA() {
  return (
    <section className="relative overflow-hidden bg-green-950 px-5 py-24 text-white lg:px-8">
      {/* Mountain Background Photo with Translucent Green Overlay (same as PageHero) */}
      <img
        src="/images/hero/hero-mustang.jpg"
        alt="Himalayan Mountain Range"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.opacity = "0";
        }}
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
          Trail notes, occasionally
        </p>

        <h2 className="mt-4 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-white">
          Himalayan Dispatch, Directly to You.
        </h2>

        <p className="mx-auto mt-4 max-w-lg leading-7 text-white/70">
          Curated route notes, seasonal gear packing advice, and local trekking insights across Nepal, delivered with care.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="mx-auto mt-8 flex max-w-md rounded-full bg-white p-1.5 shadow-lg"
        >
          <Mail className="ml-4 self-center text-slate-400 shrink-0" size={18} />
          <input
            type="email"
            required
            aria-label="Email address"
            placeholder="Your email address"
            className="min-w-0 flex-1 px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            aria-label="Subscribe"
            className="flex items-center gap-1 rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-green-950 transition hover:bg-amber-300 active:scale-95"
          >
            <span>Subscribe</span>
            <ArrowUpRight size={15} />
          </button>
        </form>
      </div>
    </section>
  );
}

export default NewsletterCTA;
