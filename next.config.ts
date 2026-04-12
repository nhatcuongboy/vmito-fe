import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone' as const,
  transpilePackages: ['react-tournament-brackets'],
  // experimental: {
  //   optimizePackageImports: ['@chakra-ui/react', 'react-icons', 'lucide-react'],
  //   serverComponentsHmrCache: true,
  // },
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
