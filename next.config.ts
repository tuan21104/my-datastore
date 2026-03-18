/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! CẢNH BÁO !!
    // Cho phép build thành công ngay cả khi dự án có lỗi TypeScript.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Lờ đi lỗi ESLint trong quá trình build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;