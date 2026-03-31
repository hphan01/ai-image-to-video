/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['fluent-ffmpeg', 'ffmpeg-static', 'ffprobe-static', 'sharp'],
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
