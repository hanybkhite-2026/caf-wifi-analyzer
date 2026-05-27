/** @type {import('next').NextConfig} */
const nextConfig = {
  // NO output: 'export' — Electron runs Next.js as a real server
  reactStrictMode: true,

  // Suppress the workspace root warning about multiple lockfiles
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
