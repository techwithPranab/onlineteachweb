/**
 * SEO Configuration for MeritAI
 * Centralized SEO settings and metadata
 */

export const seoConfig = {
  siteTitle: 'MeritAI',
  siteTitleTemplate: '%s | MeritAI',
  defaultTitle: 'MeritAI - AI-Powered Personalized Learning & Gap Analysis',
  defaultDescription: 'Find your learning gaps with AI precision. Get personalized assessments, AI practice, and master every concept with our adaptive learning platform for CBSE & ICSE students.',
  siteUrl: 'https://meritai.com',
  siteLogo: '/images/logo.png',
  siteLanguage: 'en',
  
  // Social Media
  social: {
    twitter: '@MeritAI',
    facebook: 'https://facebook.com/meritai',
    linkedin: 'https://linkedin.com/company/meritai',
    instagram: 'https://instagram.com/meritai',
    youtube: 'https://youtube.com/@meritai'
  },
  
  // Contact
  contact: {
    email: 'support@meritai.com',
    phone: '+91-XXXXXXXXXX'
  },
  
  // Default images
  images: {
    ogDefault: '/images/og-default.jpg',
    twitterDefault: '/images/twitter-image.jpg',
    logo: '/images/logo.png'
  },
  
  // Keywords by page type
  keywords: {
    global: 'AI learning platform, personalized education, online tutoring, CBSE courses, ICSE courses',
    homepage: 'AI learning, personalized learning, gap analysis, adaptive learning, online classes',
    courses: 'online courses, CBSE online courses, ICSE online courses, grade-wise learning',
    students: 'student learning, online education for students, exam preparation',
    tutors: 'become a tutor, online teaching, tutor jobs, teach online'
  }
};

// Page-specific SEO metadata
export const pageMetadata = {
  home: {
    title: 'AI-Powered Personalized Learning & Gap Analysis',
    description: 'Find your learning gaps with AI precision. Get personalized assessments, AI practice, and master every concept with our adaptive learning platform for CBSE & ICSE students.',
    keywords: seoConfig.keywords.homepage
  },
  
  courses: {
    title: 'Online Courses for CBSE & ICSE Students',
    description: 'Browse 100+ online courses for Grade 1-12 students in Math, Science, English and more. AI-powered personalized learning.',
    keywords: seoConfig.keywords.courses
  },
  
  forStudents: {
    title: 'For Students - AI-Powered Learning Platform',
    description: 'Master concepts with AI-driven gap analysis, personalized quizzes, and adaptive learning tools. Track your progress and achieve academic excellence.',
    keywords: seoConfig.keywords.students
  },
  
  forTutors: {
    title: 'Become a Tutor - Teach & Earn Online',
    description: 'Join our platform as an online tutor. Use AI tools for quiz generation, student evaluation, and live interactive teaching.',
    keywords: seoConfig.keywords.tutors
  },
  
  pricing: {
    title: 'Pricing & Plans - Affordable Online Learning',
    description: 'Flexible pricing plans for students. Choose monthly or annual subscriptions. Start with free trial. Affordable online education for all.',
    keywords: 'pricing, subscription plans, affordable learning, online course pricing'
  },
  
  helpCenter: {
    title: 'Help Center - MeritAI Support & FAQs',
    description: 'Get help with courses, payments, live classes, and more. Browse FAQs, guides, and contact our support team.',
    keywords: 'help, support, FAQs, customer service, online learning help'
  },
  
  faqs: {
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions about MeritAI, our courses, pricing, live classes, and more.',
    keywords: 'FAQs, frequently asked questions, help, support'
  },
  
  contact: {
    title: 'Contact Us - Get in Touch',
    description: 'Have questions? Contact our support team. We\'re here to help you with courses, technical issues, and more.',
    keywords: 'contact, support, help, customer service'
  },
  
  privacyPolicy: {
    title: 'Privacy Policy',
    description: 'Learn how MeritAI collects, uses, and protects your personal information.',
    keywords: 'privacy policy, data protection, privacy'
  },
  
  termsOfService: {
    title: 'Terms of Service',
    description: 'Read our terms of service and user agreement for using the MeritAI platform.',
    keywords: 'terms of service, user agreement, terms and conditions'
  }
};

// Structured Data Templates
export const structuredDataTemplates = {
  organization: {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "MeritAI",
    "url": seoConfig.siteUrl,
    "logo": `${seoConfig.siteUrl}${seoConfig.images.logo}`,
    "description": seoConfig.defaultDescription,
    "sameAs": Object.values(seoConfig.social).filter(v => typeof v === 'string' && v.startsWith('http'))
  },
  
  website: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": seoConfig.siteTitle,
    "url": seoConfig.siteUrl,
    "description": seoConfig.defaultDescription
  }
};

export default seoConfig;
