import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // silences cross-origin warnings in Cloud Workstation environment
  allowedDevOrigins: [
    '6000-firebase-studio-1779618280680.cluster-yy7ncoxb5zd4ouvntrhoc3go3k.cloudworkstations.dev',
    '9000-firebase-studio-1779618280680.cluster-yy7ncoxb5zd4ouvntrhoc3go3k.cloudworkstations.dev',
    '*.cloudworkstations.dev'
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        '6000-firebase-studio-1779618280680.cluster-yy7ncoxb5zd4ouvntrhoc3go3k.cloudworkstations.dev',
        '9000-firebase-studio-1779618280680.cluster-yy7ncoxb5zd4ouvntrhoc3go3k.cloudworkstations.dev',
        '*.cloudworkstations.dev'
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
