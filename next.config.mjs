/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Static export for GitHub Pages: no Node server there, so every route is
     written out as HTML at build time. The [slug] route already has
     generateStaticParams, so all company pages are emitted. */
  output: "export",
  trailingSlash: true,
  images: {
    /* the Next image optimizer needs a server; on Pages the tags must be
       plain <img> output. The site uses raw <img> anyway. */
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "cdn.prod.website-files.com" },
      { protocol: "https", hostname: "assets.website-files.com" },
    ],
  },
};

export default nextConfig;
