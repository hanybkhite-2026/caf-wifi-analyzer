/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['child_process', 'os'],
};
module.exports = nextConfig;
