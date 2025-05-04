
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
       // Add Firebase storage hostname if using Firebase for images
       // {
       //   protocol: 'https',
       //   hostname: 'firebasestorage.googleapis.com',
       //   port: '',
       //   pathname: '/v0/b/<your-project-id>.appspot.com/o/**', // Replace <your-project-id>
       // },
    ],
  },
};

export default nextConfig;
