/** @type {import('next').NextConfig} */
module.exports = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      use: "raw-loader",
    })
    return config
  },
  reactStrictMode: true,
  images: { unoptimized: true },
  output: 'export',
}