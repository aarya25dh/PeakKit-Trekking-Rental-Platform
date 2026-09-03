import { Clock3, Mail, MapPin, Phone, Send } from "lucide-react";
import PageHero from "../../components/common/PageHero";
import { HERO_IMAGES } from "../../data/imagePaths";

function Contact() {
  return (
    <main>
      {/* Hero Section */}
      <PageHero
        image={HERO_IMAGES.contactNepal}
        breadcrumb="PEAKKIT / CONTACT"
        title="Let's Plan Your Next Adventure"
        subtitle="Questions about rentals, pickups, destinations or partnerships? PeakKit is here to help."
      />

      {/* Contact Section */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        {/* Contact Cards */}
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <MapPin className="text-green-800" />

            <h2 className="mt-6 font-display text-xl font-semibold">
              Kathmandu Office
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Thamel, Kathmandu, Nepal
              <br />
              Pickup desk open daily.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <Mail className="text-green-800" />

            <h2 className="mt-6 font-display text-xl font-semibold">
              Email Us
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              inquiry@peakkit.example
              <br />
              We reply within one day.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <Phone className="text-green-800" />

            <h2 className="mt-6 font-display text-xl font-semibold">
              Call the Team
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              +977 9878452210
              <br />
              Every day, 8am–6pm.
            </p>
          </div>
        </div>

        {/* Form + FAQ */}
        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          {/* Contact Form */}
          <form className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="font-display text-2xl font-semibold text-green-950">
              Send a Message
            </h2>

            <div className="mt-6 grid gap-4">
              <input
                className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-800"
                placeholder="Your name"
              />

              <input
                type="email"
                className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-800"
                placeholder="Email address"
              />

              <textarea
                rows="5"
                className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-800"
                placeholder="How can we help?"
              />

              <button className="flex items-center justify-center gap-2 rounded-full bg-green-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800">
                Send Message <Send size={16} />
              </button>
            </div>
          </form>

          {/* FAQ + Map */}
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-green-900">
              <Clock3 size={17} />
              Frequently Asked
            </div>

            <div className="mt-5 grid gap-3">
              {[
                "Can I collect gear before my trek?",
                "What happens to my security deposit?",
                "Do you deliver outside Kathmandu?",
              ].map((question) => (
                <details
                  key={question}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-sm"
                >
                  <summary className="cursor-pointer font-semibold">
                    {question}
                  </summary>

                  <p className="mt-3 leading-6 text-slate-500">
                    Our team will confirm the details for your route and dates
                    before you pay.
                  </p>
                </details>
              ))}
            </div>

            {/* Google Map */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <iframe
                title="PeakKit Kathmandu Office"
                src="https://www.google.com/maps?q=Thamel,Kathmandu,Nepal&output=embed"
                width="100%"
                height="260"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Map Caption */}
            <div className="mt-3 text-sm text-slate-500">
              <MapPin size={14} className="mr-1 inline text-green-800" />
              PeakKit Pickup & Support Center • Thamel, Kathmandu, Nepal
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Contact;