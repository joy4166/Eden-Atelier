/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    const noStoreHeaders = [
      {
        key: 'Cache-Control',
        value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
      { key: 'Pragma', value: 'no-cache' },
      { key: 'Expires', value: '0' },
    ];
    return [
      {
        source: '/',
        headers: noStoreHeaders,
      },
      {
        source: '/((?!_next/static|_next/image|icon.svg|favicon.ico).*)',
        headers: noStoreHeaders,
      },
    ];
  },
};

export default nextConfig;
