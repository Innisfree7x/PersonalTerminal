import type { MetadataRoute } from 'next';

function resolveSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolveSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/features', '/pricing', '/about', '/privacy', '/terms', '/auth/login', '/auth/signup'],
        disallow: ['/today', '/calendar', '/goals', '/university', '/career', '/analytics', '/settings', '/onboarding', '/api'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
