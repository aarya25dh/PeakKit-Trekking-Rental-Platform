import { COMMUNITY_IMAGES } from "../../data/imagePaths";

const photos = [
  ["First light on the ridge", COMMUNITY_IMAGES.gallery01],
  ["Pack light, go far", COMMUNITY_IMAGES.gallery02],
  ["Camp above the clouds", COMMUNITY_IMAGES.gallery03],
  ["A trail worth sharing", COMMUNITY_IMAGES.gallery04],
  ["Morning in Mustang", COMMUNITY_IMAGES.gallery05],
  ["The long way home", COMMUNITY_IMAGES.gallery06],
];

function CommunityGallery() {
  return (
    <section className="bg-[#eef1ec] py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
          From our community
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="mt-3 font-display text-3xl font-semibold text-green-950 sm:text-4xl">
            Good days, well documented.
          </h2>
          <p className="text-sm text-slate-500">
            Tag #PeakKitNepal to be featured.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
          {photos.map(([caption, src], index) => (
            <figure
              key={caption}
              className={`group relative overflow-hidden rounded-2xl bg-[#315843] ${
                index === 1 || index === 4 ? "aspect-[.8]" : "aspect-square"
              }`}
            >
              <img
                src={src}
                alt={caption}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.opacity = "0";
                }}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-green-950/80 to-transparent p-5 pt-12 text-sm font-semibold text-white">
                {caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CommunityGallery;

