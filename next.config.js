/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Force dynamic rendering to reduce memory usage
  output: 'standalone',
  // Disable static optimization for heavy pages
  unstable_runtimeJS: true,
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
    webpackBuildWorker: true,
    parallelServerBuildTraces: false,
    parallelServerCompiles: false,
  },
  // Reduce memory usage
  staticPageGenerationTimeout: 60,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('_http_common');
    }
    return config;
  },
}

module.exports = nextConfig