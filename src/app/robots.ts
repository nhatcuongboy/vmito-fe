import { MetadataRoute } from 'next';

const isStaging = process.env.NEXT_PUBLIC_APP_ENV === 'staging';

export default function robots(): MetadataRoute.Robots {
  if (isStaging) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

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
