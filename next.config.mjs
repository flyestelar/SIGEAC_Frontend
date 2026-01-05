/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: '172.190.0.166',
      },
      {
        protocol: 'https',
        hostname: 'p818zgogs0bj.share.zrok.io',
      },
    ],
  },
};

export default nextConfig;
