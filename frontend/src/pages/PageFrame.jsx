import PageHero from "../components/common/PageHero";
import { HERO_IMAGES } from "../data/imagePaths";

function PageFrame({ title, eyebrow = "PeakKit" }) {
  return (
    <section>
      <PageHero
        title={title}
        subtitle="A considered space for your next mountain day, prepared with the PeakKit community in mind."
        image={HERO_IMAGES.langtang}
        breadcrumb={`${eyebrow.toUpperCase()} / ${title.toUpperCase()}`}
      />
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="h-64 rounded-[2rem] border border-dashed border-slate-300 bg-white" />
      </div>
    </section>
  );
}

export default PageFrame;

