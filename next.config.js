/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    rewrites: async () => {
        return [
          {
            source: "/api/py/:path*",
            destination:
              process.env.NODE_ENV === "development"
                ? "http://127.0.0.1:8000/api/py/:path*"
                : "/api/",
          },
        ];
    },
    eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
    },
}

module.exports = nextConfig

