import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/*/admin',
          '/*/host',
          '/*/auth',
          '/*/settings',
          '/*/player-status',
          '/*/join-by-code',
          '/*/guest',
        ],
      },
    ],
    sitemap: 'https://vmito.com/sitemap.xml',
  };
}
