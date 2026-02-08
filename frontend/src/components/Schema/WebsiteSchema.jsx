import React from 'react';
import PropTypes from 'prop-types';

/**
 * Website Schema - Represents the entire website
 * Used on homepage
 */
const WebsiteSchema = ({ searchUrl }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MeritAI",
    "alternateName": "MeritAI - AI-Powered Learning Platform",
    "url": typeof window !== 'undefined' ? window.location.origin : "https://meritai.com",
    "description": "Find your learning gaps with AI precision. Get personalized assessments, expert mentorship, and master every concept with our adaptive learning platform.",
    "publisher": {
      "@type": "EducationalOrganization",
      "name": "MeritAI",
      "logo": {
        "@type": "ImageObject",
        "url": typeof window !== 'undefined' ? `${window.location.origin}/images/logo.png` : ""
      }
    },
    "potentialAction": searchUrl ? {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${searchUrl}?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    } : undefined
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

WebsiteSchema.propTypes = {
  searchUrl: PropTypes.string
};

export default WebsiteSchema;
