import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone' as const,
  transpilePackages: ['react-tournament-brackets'],
  experimental: {
    optimizePackageImports: ['@chakra-ui/react', 'react-icons', 'lucide-react'],
    serverComponentsHmrCache: true,
    // Inline the route CSS into the HTML instead of a render-blocking
    // stylesheet request (~150ms saved on first paint)
    inlineCss: true,
  },
  images: {
    // Serve modern formats to browsers that support them
    formats: ['image/avif', 'image/webp'] as ('image/avif' | 'image/webp')[],
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https' as const,
        hostname: 'play-lh.googleusercontent.com',
      },
      {
        protocol: 'https' as const,
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'http' as const,
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
})(nextConfig);
