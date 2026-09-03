import { Mountain } from "lucide-react";

function ImagePlaceholder({
  text = "Image Coming Soon",
  className = "",
  aspectRatio = "aspect-square",
  subtext = "PeakKit Outdoor Gear",
}) {
  return (
    <div
      role="img"
      aria-label={text}
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-[#244c39]/10 via-[#244c39]/5 to-stone-100 p-6 text-center text-slate-500 shadow-inner ${aspectRatio} ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <Mountain className="h-6 w-6 text-green-800 opacity-80" />
      </div>
      <span className="mt-3 font-display text-xs font-semibold uppercase tracking-wider text-green-950/80">
        {text}
      </span>
      {subtext && (
        <span className="mt-0.5 text-[11px] text-slate-400">{subtext}</span>
      )}
    </div>
  );
}

export default ImagePlaceholder;
