import { ChevronLeft, ChevronRight, CloudSun, ShieldCheck } from "lucide-react";
import { Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Link } from "react-router-dom";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";

const slides = [
  {
    name: "Annapurna Base Camp",
    difficulty: "Moderate",
    season: "Mar-May · Oct-Nov",
    price: "NPR 2,850",
    file: "hero-annapurna.jpg",
    altitude: "4,130m",
    headlineMain: "Explore more.",
    headlineHighlight: "Carry less.",
    description: "Rent trusted trekking gear, reserve personalized adventure kits, and spend your energy on the trails instead of expensive equipment.",
  },
  {
    name: "Everest Base Camp",
    difficulty: "Challenging",
    season: "Mar-May · Oct-Nov",
    price: "NPR 4,200",
    file: "hero-everest.jpg",
    altitude: "5,364m",
    headlineMain: "Reach high.",
    headlineHighlight: "Pack smart.",
    description: "Sub-zero alpine sleeping bags, 800-fill down parkas, and safety-tested crampons delivered directly to your doorstep in Kathmandu.",
  },
  {
    name: "Langtang Valley",
    difficulty: "Moderate",
    season: "Mar-May · Oct-Nov",
    price: "NPR 2,400",
    file: "hero-langtang.jpg",
    altitude: "3,870m",
    headlineMain: "Sacred valleys.",
    headlineHighlight: "Reliable gear.",
    description: "Lightweight 4-season tents, ergonomic trekking poles, and waterproof shells tailored for the Tamang Heritage trail.",
  },
  {
    name: "Mardi Himal",
    difficulty: "Easy",
    season: "All year",
    price: "NPR 1,850",
    file: "hero-mardi.jpg",
    altitude: "4,500m",
    headlineMain: "Sunrise ridges.",
    headlineHighlight: "Light footsteps.",
    description: "Compact technical packs and thermal layers engineered for panoramic dawn viewpoints over Machapuchare.",
  },
  {
    name: "Mustang Camping",
    difficulty: "Challenging",
    season: "May-Oct",
    price: "NPR 3,600",
    file: "hero-mustang.jpg",
    altitude: "3,840m",
    headlineMain: "Ancient paths.",
    headlineHighlight: "Built to last.",
    description: "Windproof expedition shelters and mountain cook sets curated for arid high-plateau wilderness treks.",
  },
];

function HeroCarousel() {
  return (
    <section className="relative">
      <Swiper
        modules={[Autoplay, EffectFade, Navigation, Pagination]}
        effect="fade"
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        navigation={{ prevEl: ".hero-prev", nextEl: ".hero-next" }}
        pagination={{ clickable: true }}
        loop
        className="h-[min(85vh,780px)] min-h-[620px]"
      >
        <div className="hero-prev absolute left-5 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/15 text-white backdrop-blur hover:bg-white hover:text-green-950">
          <ChevronLeft />
        </div>
        <div className="hero-next absolute right-5 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/15 text-white backdrop-blur hover:bg-white hover:text-green-950">
          <ChevronRight />
        </div>
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.name}>
            <div className="relative h-full overflow-hidden bg-[#244c39]">
              <img
                src={`/images/hero/${slide.file}`}
                alt={slide.name}
                loading="lazy"
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.opacity = "0";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-green-950/80 via-green-950/35 to-green-950/10" />
              <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-5 pb-28 lg:items-center lg:px-8 lg:pb-0">
                <div className="max-w-2xl text-white">
                  <p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
                    Made for Nepal's trails
                  </p>
                  {index === 0 ? (
                    <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
                      {slide.headlineMain}<br />
                      <span className="text-amber-300">{slide.headlineHighlight}</span>
                    </h1>
                  ) : (
                    <h2 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
                      {slide.headlineMain}<br />
                      <span className="text-amber-300">{slide.headlineHighlight}</span>
                    </h2>
                  )}
                  <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">
                    {slide.description}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      to="/explore"
                      className="rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-green-950 hover:bg-amber-300"
                    >
                      Explore gear
                    </Link>
                    <Link
                      to="/gear-advisor"
                      className="rounded-full border border-white/50 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
                    >
                      Build my adventure kit
                    </Link>
                    <Link
                      to="/community"
                      className="px-3 py-3 text-sm font-semibold text-white/80 hover:text-white"
                    >
                      Watch how it works
                    </Link>
                  </div>
                  <div className="mt-7 flex flex-wrap gap-4 text-xs font-semibold text-white/75">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={15} className="text-amber-300" /> Verified gear
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={15} className="text-amber-300" /> Sanitized equipment
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={15} className="text-amber-300" /> Community trusted
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-12 right-8 hidden w-52 rounded-2xl border border-white/20 bg-green-950/45 p-4 text-white backdrop-blur-md lg:block">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
                  <CloudSun size={16} className="text-amber-300" /> Trail conditions
                </div>
                <strong className="mt-3 block font-display text-lg">Clear & crisp</strong>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-white/65">
                  <span>
                    Altitude<strong className="mt-1 block text-white">{slide.altitude}</strong>
                  </span>
                  <span>
                    Savings<strong className="mt-1 block text-amber-300">Up to 89%</strong>
                  </span>
                </div>
                <p className="mt-4 border-t border-white/15 pt-3 text-xs text-white/65">
                  {slide.difficulty} · {slide.season}<br />
                  <strong className="mt-1 block text-white">From {slide.price}</strong>
                </p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

export default HeroCarousel;
