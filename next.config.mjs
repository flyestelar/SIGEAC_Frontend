 /** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'p818zgogs0bj.share.zrok.io',
      },
      {
        protocol: 'http',
        hostname: '172.190.0.166',
        port: '81',
      }
    ],
  },
};

export default nextConfig;
