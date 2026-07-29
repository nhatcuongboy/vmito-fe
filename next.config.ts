import withPWA from 'next-pwa';
import withBundleAnalyzer from '@next/bundle-analyzer';

// Run `ANALYZE=true pnpm build` to inspect bundle composition
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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
        // Facebook Graph profile picture, used as the avatar for accounts
        // that signed up via "Sign in with Facebook" (see
        // FacebookStrategy.validate -> photos[0].value in vmito-be).
        protocol: 'https' as const,
        hostname: 'platform-lookaside.fbsbx.com',
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

export default bundleAnalyzer(
  withPWA({
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
    // next-pwa is typed against an older Next.js; the runtime shape is compatible
  })(nextConfig) as Parameters<typeof bundleAnalyzer>[0]
);
