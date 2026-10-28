/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@erp/ui', '@erp/domain-core', '@erp/contracts'],
  poweredByHeader: false,
  typedRoutes: true,
  async redirects() {
    return [{ source: '/', destination: '/ar', permanent: false }];
  },
};

export default nextConfig;
