/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    domains: ["storage.googleapis.com"],
  },
  env: {
    // Only include if the env var exists
    ...(process.env.CUSTOM_KEY && { CUSTOM_KEY: process.env.CUSTOM_KEY }),
  },
  async rewrites() {
    // Only add rewrite if API URL is defined
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [
        {
          source: "/api/:path*",
          destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
