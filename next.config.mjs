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
      allowedOrigins: [
        "http://localhost:3000",
        "https://daadnegar.com",
        "https://stage.daadnegar.com",
      ],
      bodySizeLimit: "10mb", // Increase body size limit for file uploads
    },
  },
};

export default nextConfig;
