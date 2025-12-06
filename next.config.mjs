/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // ⚠ ビルド中の ESLint をスキップする
    ignoreDuringBuilds: true,
  }
}

export default nextConfig
