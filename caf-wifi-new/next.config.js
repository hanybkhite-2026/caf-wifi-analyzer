/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['child_process', 'os'],
  // Static export for Capacitor APK build
  // Run: npm run build:mobile to export, npm run build for Vercel
};

// Use static export only when building for mobile
if (process.env.BUILD_TARGET === 'mobile') {
  nextConfig.output = 'export';
  nextConfig.images = { unoptimized: true };
}

module.exports = nextConfig;
