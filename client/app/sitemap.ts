import type { MetadataRoute } from 'next';
import { PUBLIC_ROUTES, SITE_URL } from '@/constants/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.path === '/' ? 'weekly' : 'monthly',
    priority: route.priority,
  }));
}
