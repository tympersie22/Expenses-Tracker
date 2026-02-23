/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure environment variables are properly exposed to the client
  env: {
    MONO_ENV: process.env.MONO_ENV,
    MONO_PUBLIC_KEY: process.env.MONO_PUBLIC_KEY,
  },
  // Configure webpack to handle any issues with dependencies
  webpack: (config, { isServer }) => {
    // Fix for "window is not defined" errors
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig; 
