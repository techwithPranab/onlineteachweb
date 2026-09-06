import React from 'react';

/**
 * Organization Schema for MeritAI
 * Helps search engines and AI tools understand the organization
 */
const OrganizationSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "MeritAI",
    "alternateName": "MeritAI - AI-Powered Learning Platform",
    "url": typeof window !== 'undefined' ? window.location.origin : "https://meritai.com",
    "logo": typeof window !== 'undefined' ? `${window.location.origin}/images/logo.png` : "",
    "description": "AI-Powered Personalized Learning Platform that identifies knowledge gaps and provides personalized assessments for targeted skill development.",
    "foundingDate": "2024",
    "email": "support@meritai.com",
    "areaServed": {
      "@type": "Country",
      "name": "India"
    },
    "sameAs": [
      "https://facebook.com/meritai",
      "https://twitter.com/meritai",
      "https://linkedin.com/company/meritai",
      "https://instagram.com/meritai",
      "https://youtube.com/@meritai"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "email": "support@meritai.com",
      "availableLanguage": ["English", "Hindi"]
    },
    "serviceType": [
      "Online Education",
      "Personalized Learning",
      "AI-Powered Tutoring",
      "Live Online Classes",
      "Student Assessment"
    ],
    "knowsAbout": [
      "Artificial Intelligence in Education",
      "Personalized Learning",
      "Gap Analysis",
      "Online Tutoring",
      "CBSE Curriculum",
      "ICSE Curriculum",
      "Student Assessment",
      "Adaptive Learning"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default OrganizationSchema;
