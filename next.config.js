/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
    },
    async rewrites() {
        return [
            {
                source: '/api/py/:path*',
                destination: 'https://masking-tester-api.onrender.com/api/:path*',
            },
        ]
    },
}

module.exports = nextConfig

