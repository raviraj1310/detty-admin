/** @type {import('next').NextConfig} */
const remotePatterns = [
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "api.accessdettyfusion.com", pathname: "/api/v1/upload/image/**" },
  { protocol: "https", hostname: "accessdettyfusion.com", pathname: "/upload/image/**" },
  { protocol: "http", hostname: "localhost", port: "5000", pathname: "/upload/image/**" },
  { protocol: "http", hostname: "127.0.0.1", port: "5000", pathname: "/upload/image/**" },
  { protocol: "http", hostname: "102.37.218.236", pathname: "/api/upload/image/**" },
  { protocol: "http", hostname: "102.37.218.236", pathname: "/upload/image/**" },
];

const origin = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN;
if (origin) {
  try {
    const u = new URL(origin);
    const pattern = {
      protocol: u.protocol.replace(":", ""),
      hostname: u.hostname,
      pathname: "/**",
    };
    if (u.port) pattern.port = u.port;
    remotePatterns.push(pattern);
  } catch {}
}

const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp"],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
