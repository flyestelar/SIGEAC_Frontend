 /** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'p818zgogs0bj.share.zrok.io',
      },
    ],
  },
};

export default nextConfig;
