import { Camera, Heart, MapPin, Users } from "lucide-react";
import PageHero from "../../components/common/PageHero";
import { COMMUNITY_IMAGES } from "../../data/imagePaths";

const stories = [
  ["Sunrise above Mardi", "Anisha · 2 days ago", COMMUNITY_IMAGES.mardiSunrise],
  ["First steps to base camp", "Daniel · 1 week ago", COMMUNITY_IMAGES.everestTrail],
  ["A pack that keeps up", "Ramesh · 2 weeks ago", COMMUNITY_IMAGES.trailPack],
];

function Community() {
  return (
    <main>
      <PageHero
        image={COMMUNITY_IMAGES.communityHero}
        breadcrumb="PEAKKIT / COMMUNITY"
        title="Stories From the Trail"
        subtitle="Adventures shared by trekkers across Everest, Annapurna, Langtang, Mustang, Rolwaling and beyond."
        primaryButton={{
          text: "Join PeakKit",
          to: "/register",
        }}
      />

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
              From the trail
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-green-950">
              Recent gear stories
            </h2>
          </div>
          <span className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <Users size={17} /> 2,400+ members
          </span>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {stories.map(([title, author, image]) => (
            <article
              key={title}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="aspect-[1.35] bg-[#e7ece7]">
                <img
                  src={image}
                  alt={title}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                  className="h-full w-full object-cover transition duration-500 hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Camera size={14} /> Community photo
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold text-slate-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-slate-500">{author}</p>
                <div className="mt-5 flex gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Heart size={15} /> 24
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={15} /> Nepal
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Community;

