import { ArrowRight, Compass, Heart, Mountain, PackageCheck, TentTree } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AdventureSearchWidget from "../../components/home/AdventureSearchWidget";
import HeroCarousel from "../../components/home/HeroCarousel";
import TrustStrip from "../../components/home/TrustStrip";
import FeaturedGearCarousel from "../../components/home/FeaturedGearCarousel";
import DestinationGrid from "../../components/home/DestinationGrid";
import WeatherSeasonSection from "../../components/home/WeatherSeasonSection";
import CommunityGallery from "../../components/home/CommunityGallery";
import SustainabilitySection from "../../components/home/SustainabilitySection";
import NewsletterCTA from "../../components/home/NewsletterCTA";
import TrendingSection from "../../components/home/TrendingSection";
import Testimonials from "../../components/home/Testimonials";
import { categories, kits, stats } from "../../utils/constants";

const categoryList = categories;
const steps = [[Compass, "Choose destination"], [Mountain, "Get a personal kit"], [PackageCheck, "Reserve your gear"], [TentTree, "Pick up or delivery"], [Heart, "Return after your trek"]];

function Home() {
  return (
    <div>
      <HeroCarousel />
      <AdventureSearchWidget />
      <TrustStrip />
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto max-w-7xl px-5 py-20 lg:px-8"
      >
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="border-l border-slate-200 pl-5 first:border-0 first:pl-0"
            >
              <strong className="font-display text-3xl text-green-900">
                {["1,200+", "89%", "48", "4.8"][index]}
              </strong>
              <p className="mt-2 text-sm leading-5 text-slate-500">
                {[
                  "Gear available",
                  "Average savings",
                  "Destinations covered",
                  "Community rating",
                ][index]}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      <section className="bg-[#eef1ec] py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            Start with what you need
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-green-950 sm:text-4xl">
            Pack for the place, not every possibility.
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categoryList.map((category) => (
              <Link
                to="/explore"
                key={category.name}
                className="group relative aspect-[.9] overflow-hidden rounded-2xl bg-[#315843]"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.opacity = "0";
                  }}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-green-950/85 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 text-white">
                  <h3 className="font-display text-lg font-semibold">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-xs text-white/65">{category.count}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-300">
                    Explore <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FeaturedGearCarousel />
      <DestinationGrid />
      <WeatherSeasonSection />

      {/* Ready-made Routes / Adventure Kits */}
      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
          Ready-made routes
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-green-950 sm:text-4xl">
          A head start for every kind of day.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {kits.map((kit) => (
            <article
              key={kit.name}
              className="group overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-emerald-700/40 flex flex-col justify-between"
            >
              <div className="relative aspect-[1.4] overflow-hidden bg-[#315843]">
                <img
                  src={kit.image}
                  alt={kit.name}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.opacity = "0";
                  }}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
              <div className="p-6">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  {kit.tag}
                </span>
                <h3 className="mt-2 font-display text-2xl font-bold text-green-950 transition-colors group-hover:text-green-800">
                  {kit.name}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {kit.duration} · 12 essential items
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <strong className="font-display text-lg text-green-900">{kit.price}</strong>
                  <Link
                    to="/adventure-kit"
                    className="rounded-full bg-green-50 px-4 py-2 text-xs font-bold text-green-900 transition-all duration-200 group-hover:bg-green-900 group-hover:text-white shadow-2xs"
                  >
                    View kit
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f3f4f1] py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            The PeakKit way
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-green-950 sm:text-4xl">
            A simpler way to get outside.
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-5">
            {steps.map(([Icon, text], index) => (
              <div key={text} className="rounded-2xl bg-white p-6 shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-green-50 text-green-800">
                  <Icon size={21} />
                </span>
                <span className="mt-5 block text-xs font-bold text-amber-600">
                  0{index + 1}
                </span>
                <h3 className="mt-2 font-display font-semibold">{text}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CommunityGallery />
      <TrendingSection />
      <Testimonials />

      {/* About PeakKit Section - Warm Cream Full-Width Section */}
      <section className="bg-[#f4f5f0] py-24 border-t border-slate-200/50">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2 lg:items-center lg:px-8">
          <div className="relative aspect-[1.2] overflow-hidden rounded-[2.5rem] bg-[#315843] shadow-lg border border-slate-200/80">
            <img
              src="/images/about/story.jpg"
              alt="PeakKit team on a Nepal trail"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.opacity = "0";
              }}
              className="h-full w-full object-cover transition duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-green-950/60 via-transparent to-transparent" />
            
            {/* Floating Badges on Image */}
            <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-white">
              <span className="rounded-full bg-white/90 px-3.5 py-1.5 text-green-950 shadow-md backdrop-blur-xs font-bold">
                🏔️ Tested on EBC, ABC & Mardi Trails
              </span>
              <span className="rounded-full bg-green-950/80 px-3.5 py-1.5 text-amber-300 border border-white/20 backdrop-blur-xs">
                100% Nepali-Owned
              </span>
            </div>
          </div>

          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-800 border border-amber-200">
              About PeakKit
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-green-950 leading-tight">
              Built for every trail in Nepal.
            </h2>
            <p className="text-base leading-relaxed text-slate-600">
              PeakKit helps trekkers access premium outdoor gear without buying
              thousands of rupees worth of equipment.
            </p>
            <p className="text-base leading-relaxed text-slate-600">
              Our mission is to make adventure affordable, sustainable, and
              accessible, one shared pack at a time.
            </p>

            <div className="grid gap-3 pt-2 text-xs font-semibold text-slate-700 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-xl bg-white p-3 border border-slate-200 shadow-2xs">
                <span className="text-emerald-700 font-bold">✓</span>
                <span>Sanitized & Mountain-Checked</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white p-3 border border-slate-200 shadow-2xs">
                <span className="text-emerald-700 font-bold">✓</span>
                <span>Doorstep Delivery & Hub Pickups</span>
              </div>
            </div>

            <div className="pt-3">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-full bg-green-900 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-green-800"
              >
                <span>Read our story</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SustainabilitySection />

      {/* Community Section - Standalone Warm Sage-Cream Full-Width Section (No Box) */}
      <section className="bg-[#eef2ea] py-24 border-t border-slate-200/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8 px-5 lg:px-8">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800 border border-emerald-300">
              The trail is waiting
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-green-950">
              Step Onto the Trail With Confidence.
            </h2>
            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              Join a growing outdoor community making high-altitude trekking gear affordable, sustainable, and accessible across Nepal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/community"
              className="rounded-full bg-green-900 px-7 py-4 text-sm font-bold text-white shadow-md transition hover:bg-green-800"
            >
              Join the community
            </Link>
            <Link
              to="/adventure-kit"
              className="rounded-full border border-slate-300 bg-white px-7 py-4 text-sm font-bold text-slate-800 shadow-2xs transition hover:bg-stone-50"
            >
              Explore adventure kits
            </Link>
          </div>
        </div>
      </section>

      <NewsletterCTA />
    </div>
  );
}

export default Home;
