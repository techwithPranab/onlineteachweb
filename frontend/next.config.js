/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    // Handle fabric.js which has some compatibility issues
    config.externals = config.externals || {};
    config.externals.canvas = 'canvas';
    
    return config;
  },
  transpilePackages: ['fabric'],
};

module.exports = nextConfig;
