/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
      bodySizeLimit: "10mb", // Increase body size limit for file uploads
    },
  },
};

export default nextConfig;
