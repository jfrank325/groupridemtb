import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mtbgroupride.com';
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/rides`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/trails`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Dynamic pages - trails
  let trailPages: MetadataRoute.Sitemap = [];
  try {
    const trails = await prisma.trail.findMany({
      select: { id: true, updatedAt: true },
      take: 1000, // Limit to prevent excessive generation
    });

    trailPages = trails.map((trail) => ({
      url: `${baseUrl}/trails/${trail.id}`,
      lastModified: trail.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error generating trail sitemap:', error);
  }

  // Dynamic pages - rides (only public/past rides for SEO)
  let ridePages: MetadataRoute.Sitemap = [];
  try {
    const rides = await prisma.ride.findMany({
      where: {
        date: {
          lte: new Date(), // Only past rides for SEO
        },
      },
      select: { id: true, updatedAt: true },
      take: 500,
      orderBy: { date: 'desc' },
    });

    ridePages = rides.map((ride) => ({
      url: `${baseUrl}/rides/${ride.id}`,
      lastModified: ride.updatedAt || new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Error generating ride sitemap:', error);
  }

  return [...staticPages, ...trailPages, ...ridePages];
}

