/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '172.190.0.162',
        port: '83',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'p818zgogs0bj.share.zrok.io',
      },
    ],
  },
};

export default nextConfig;
