import { ArrowRight, Heart, Leaf, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "../../components/common/PageHero";
import SEO from "../../components/common/SEO";
import { HERO_IMAGES } from "../../data/imagePaths";



const values = [
  [Heart, "Accessibility", "Adventure should feel open to everyone."],
  [Leaf, "Sustainability", "Keep good equipment moving and useful."],
  [ShieldCheck, "Safety", "Trust is built into every rental."],
  [Users, "Community", "Local knowledge makes better journeys."],
];

function About() {
  return (
    <main>
      <SEO
        title="Our Story"
        description="PeakKit was born in Nepal to make trekking affordable, sustainable, and accessible through quality reusable outdoor gear. Learn who we are and why we do it."
        canonical="/about"
      />
      <PageHero
        image={HERO_IMAGES.aboutHimalayas}
        breadcrumb="ABOUT / OUR STORY"
        title="Born in Nepal. Built for Every Adventure."
        subtitle="Crafting an accessible, sustainable way for adventurers to experience the Himalayas without heavy gear investments."
      />

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            Who we are
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-green-950">
            One idea, shared widely.
          </h2>
        </div>
        <div className="space-y-5 leading-7 text-slate-600">
          <p>
            Our initiative started with one belief: exploring the high mountains
            should never require buying costly single-use gear.
          </p>
          <p>
            Inspired by Nepal's local gear communities, we connect trekkers with
            well-maintained equipment, practical route advice, and the people who
            know these mountains best.
          </p>
        </div>
      </section>

      <section className="bg-[#eef1ec] py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            What guides us
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-green-950">
            Values for the long way.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(([Icon, title, text]) => (
              <div key={title} className="rounded-2xl bg-white p-6 shadow-sm">
                <Icon className="text-green-800" />
                <h3 className="mt-7 font-display text-xl font-semibold">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <h2 className="font-display text-4xl font-semibold text-green-950">
          A small beginning, a wide horizon.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {[
            "2026 · Semester project",
            "Prototype · First routes",
            "Community platform · Next chapter",
            "Future vision · Every trail",
          ].map((item) => (
            <div
              key={item}
              className="border-l-2 border-amber-400 pl-5 text-sm font-semibold text-slate-600"
            >
              {item}
            </div>
          ))}
        </div>
        <Link
          to="/community"
          className="mt-12 inline-flex items-center gap-2 text-sm font-bold text-green-900"
        >
          Meet the community <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  );
}

export default About;

