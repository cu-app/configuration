/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Serve Flutter MX app at /mx-app and /mx-app/ (Dual Studio iframe)
  async rewrites() {
    return [
      { source: '/mx-app', destination: '/mx-app/index.html' },
      { source: '/mx-app/', destination: '/mx-app/index.html' },
    ]
  },
}

export default nextConfig
