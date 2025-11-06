import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mtbgroupride.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/login',
          '/register',
          '/profile',
          '/messages',
          '/rides/new',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

