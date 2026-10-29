import type { NextConfig } from "next";

/**
 * Workspace packages are consumed from TypeScript source (internal-packages
 * pattern); Next transpiles them. The design system joins in PHASE-005.
 */
const nextConfig: NextConfig = {
  transpilePackages: ["@erp/domain-core", "@erp/contracts"],
  // Arabic-first entry: bare "/" redirects to the default locale segment
  // (the [locale] layout owns <html lang dir> — PHASE-003 §2.14).
  async redirects() {
    return [{ source: "/", destination: "/ar", permanent: false }];
  },
};

export default nextConfig;
