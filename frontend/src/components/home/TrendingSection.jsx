import { ArrowUpRight, Flame, Map, Users } from "lucide-react";

const items = [
  [Flame, "Trending trek", "Mardi Himal in five unhurried days"],
  [Map, "Trending gear", "The Alpine Trek 45L Pack"],
  [Users, "Trending story", "How Kathmandu trekkers share better"],
];

function TrendingSection() {
  return (
    <section className="bg-[#f4f5f0] py-24 border-y border-slate-200/50">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
          In the community
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-green-950 sm:text-4xl">
          Trending this week.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {items.map(([Icon, label, title]) => (
            <article
              key={label}
              className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-green-50 text-green-800">
                <Icon size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  {label}
                </p>
                <h3 className="mt-1 font-display font-semibold text-slate-900 truncate">
                  {title}
                </h3>
              </div>
              <ArrowUpRight className="ml-auto shrink-0 text-slate-400" size={18} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TrendingSection;
