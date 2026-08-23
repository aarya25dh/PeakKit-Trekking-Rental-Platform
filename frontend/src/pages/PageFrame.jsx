import HeroBanner from "../components/common/HeroBanner";

function PageFrame({ title, eyebrow = "PeakKit" }) {
  return <section><HeroBanner title={title} subtitle="A considered space for your next mountain day, prepared with the PeakKit community in mind." backgroundImage="/images/hero/hero-langtang.jpg" breadcrumbs={[eyebrow, title]} /><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="h-64 rounded-[2rem] border border-dashed border-slate-300 bg-white" /></div></section>;
}
export default PageFrame;
