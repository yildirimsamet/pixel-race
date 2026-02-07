/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  reactStrictMode: true,
  experimental: {
    missingSuspenseWithCSRBailout: false
  }
}

module.exports = nextConfig
