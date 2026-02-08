/**
 * Next.js Sitemap Configuration
 * Generates dynamic sitemap for all public pages
 */

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://meritai.com',
  generateRobotsTxt: false, // We have custom robots.txt
  generateIndexSitemap: true,
  sitemapSize: 5000,
  
  // Exclude private routes
  exclude: [
    '/student/*',
    '/tutor/*',
    '/admin/*',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/signup-success',
    '/404',
    '/500',
    '/api/*'
  ],
  
  // Transform entries
  transform: async (config, path) => {
    // Custom priority and changefreq based on path
    let priority = 0.5;
    let changefreq = 'monthly';
    
    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (path.startsWith('/courses')) {
      priority = 0.8;
      changefreq = 'weekly';
    } else if (path.startsWith('/course/')) {
      priority = 0.7;
      changefreq = 'monthly';
    } else if (path === '/for-students' || path === '/for-tutors' || path === '/pricing') {
      priority = 0.9;
      changefreq = 'weekly';
    }
    
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
  
  // Additional paths to include
  additionalPaths: async (config) => {
    const result = [];
    
    // Add dynamic course pages (you'll need to fetch these from your API)
    // Example: const courses = await fetchCourses();
    // courses.forEach(course => {
    //   result.push({
    //     loc: `/course/${course.id}`,
    //     changefreq: 'monthly',
    //     priority: 0.7,
    //     lastmod: course.updatedAt,
    //   });
    // });
    
    return result;
  },
  
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/student/', '/tutor/', '/admin/', '/api/'],
      },
    ],
  },
};
