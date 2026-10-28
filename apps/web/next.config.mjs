/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  async redirects() {
    return [{ source: '/', destination: '/ar', permanent: false }];
  },
};

export default nextConfig;
