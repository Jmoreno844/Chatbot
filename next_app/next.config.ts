import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "export", // Add this line
  trailingSlash: true, // This will generate /home/index.html instead of /home.html
};

export default nextConfig;
