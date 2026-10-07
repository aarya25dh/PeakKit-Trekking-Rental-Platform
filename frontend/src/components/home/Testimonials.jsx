import { Star } from "lucide-react";
import { testimonials } from "../../utils/constants";
function Testimonials() {
  return (
    <section className="bg-[#f3f4f1] py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
          Good company
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-green-950 sm:text-4xl">
          The trail is better together.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <blockquote key={item.name} className="rounded-2xl bg-white p-7 shadow-sm">
              <div className="flex gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={14} fill="currentColor" />
                ))}
              </div>
              <p className="mt-5 leading-7 text-slate-600">“{item.quote}”</p>
              <footer className="mt-7 flex items-center gap-3">
                <img
                  src={item.image}
                  alt={`${item.name} avatar`}
                  loading="lazy"
                  className="h-10 w-10 rounded-full bg-stone-100 object-cover"
                />
                <span>
                  <strong className="block text-sm">{item.name}</strong>
                  <small className="text-xs text-slate-500">{item.role}</small>
                </span>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
export default Testimonials;
