import PageHero from "./PageHero";

function HeroBanner({
  title,
  subtitle,
  backgroundImage,
  breadcrumbs = [],
}) {
  const breadcrumbText = Array.isArray(breadcrumbs)
    ? breadcrumbs.join(" / ")
    : breadcrumbs;

  return (
    <PageHero
      title={title}
      subtitle={subtitle}
      image={backgroundImage}
      breadcrumb={breadcrumbText}
    />
  );
}

export default HeroBanner;

