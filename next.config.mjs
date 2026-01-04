/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    // ⚠ ビルド中の ESLint をスキップする
    ignoreDuringBuilds: true,
  }
}

export default nextConfig
