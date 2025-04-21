/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure environment variables are properly exposed to the client
  env: {
    PLAID_ENV: process.env.PLAID_ENV,
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