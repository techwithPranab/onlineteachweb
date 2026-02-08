import { Helmet } from 'react-helmet-async';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';

/**
 * SEO Component for Meta Tags and Structured Data
 * Optimized for both traditional search engines and AI search tools
 */
const SEOHead = ({
  title,
  description,
  keywords,
  author = 'MeritAI',
  ogType = 'website',
  ogImage,
  twitterCard = 'summary_large_image',
  twitterImage,
  canonical,
  noindex = false,
  nofollow = false,
  jsonLd,
  additionalMetaTags = [],
  children
}) => {
  const router = useRouter();

  // Construct full title
  const siteTitle = 'MeritAI';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;

  // Get base URL - handle SSR
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://meritai.com';

  // Default OG image
  const defaultOgImage = ogImage || `${baseUrl}/images/og-default.jpg`;
  const defaultTwitterImage = twitterImage || defaultOgImage;

  // Canonical URL - handle SSR
  const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.href : `${baseUrl}${router.asPath}`);

  // Robots meta
  const robotsContent = [];
  if (noindex) robotsContent.push('noindex');
  if (nofollow) robotsContent.push('nofollow');
  const robots = robotsContent.length > 0 ? robotsContent.join(', ') : 'index, follow';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={author} />
      <meta name="robots" content={robots} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={defaultOgImage} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={defaultTwitterImage} />
      <meta name="twitter:site" content="@MeritAI" />
      <meta name="twitter:creator" content="@MeritAI" />

      {/* Additional Meta Tags */}
      {additionalMetaTags.map((tag, index) => (
        <meta key={index} {...tag} />
      ))}

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}

      {/* Additional Elements */}
      {children}
    </Helmet>
  );
};

SEOHead.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string.isRequired,
  keywords: PropTypes.string,
  author: PropTypes.string,
  ogType: PropTypes.string,
  ogImage: PropTypes.string,
  twitterCard: PropTypes.string,
  twitterImage: PropTypes.string,
  canonical: PropTypes.string,
  noindex: PropTypes.bool,
  nofollow: PropTypes.bool,
  jsonLd: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  additionalMetaTags: PropTypes.arrayOf(PropTypes.object),
  children: PropTypes.node
};

export default SEOHead;
