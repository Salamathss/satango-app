import { Helmet } from "react-helmet-async";

const SITE = "https://score-scape-journey.lovable.app";

interface Props {
  title: string;
  description: string;
  path: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Per-route <head> tags — title, description, self-referencing canonical,
 * matching og:*, and optional JSON-LD. Used by public routes to give each
 * page unique metadata for search engines and JS-executing crawlers.
 */
const SeoHead = ({ title, description, path, jsonLd }: Props) => {
  const url = `${SITE}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SeoHead;
