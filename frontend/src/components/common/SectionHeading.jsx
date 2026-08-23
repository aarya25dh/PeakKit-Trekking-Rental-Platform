function SectionHeading({ eyebrow, title, subtitle, light = false }) {
  return (
    <div className={`max-w-2xl ${light ? "text-white" : "text-slate-900"}`}>
      {eyebrow && <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-amber-500">{eyebrow}</p>}
      <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className={`mt-4 text-base leading-7 ${light ? "text-white/70" : "text-slate-500"}`}>{subtitle}</p>}
    </div>
  );
}

export default SectionHeading;
