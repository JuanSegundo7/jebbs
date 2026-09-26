/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Menu photos are 300KB-1MB originals in Supabase Storage but render as
    // 60px thumbnails; optimizing them (resized WebP/AVIF, cached) keeps
    // the list light enough that images stop failing on slow connections.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gvhbhxwpldatspksrwkl.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
