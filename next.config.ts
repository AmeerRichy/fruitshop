import path from "node:path";
const projectRoot = path.resolve(__dirname);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
  images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "images.unsplash.com",
    },
    {
      protocol: "https",
      hostname: "res.cloudinary.com",
    },
    {
      protocol: "https",
      hostname: "placehold.co",
    },
    {
      protocol: "https",
      hostname: "pbs.twimg.com",
    },
    {
      protocol: "https",
      hostname: "img.magnific.com",
    },
  ],
},
};

export default nextConfig;
