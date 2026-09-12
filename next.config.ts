import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The project no longer uses player photos. This configuration is kept
    // for any future re-addition and to avoid Next.js Image warnings if
    // image_url values from Supabase are ever non-null.
    remotePatterns: [],
    // Unoptimized is NOT set — keep default optimization for any static assets.
  },
};

export default nextConfig;
