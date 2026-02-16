let withBundleAnalyzer = (config) => config;
if (process.env.ANALYZE === 'true') {
  try {
    // Optional dependency. If absent, build still works without analyzer output.
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    });
  } catch {
    // eslint-disable-next-line no-console
    console.warn('ANALYZE=true set but @next/bundle-analyzer is not installed.');
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://www.googleapis.com; font-src 'self'",
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
