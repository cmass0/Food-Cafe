// /** @type {import('next').NextConfig} */
// const nextConfig = {
//     async redirects() {
//       return [
//         {
//           source: '/',
//           destination: 'https://www.google.com',
//           permanent: false,
//         },
//       ];
//     },
//   };

//   module.exports = nextConfig;
module.exports = {
  images: {
    domains: ["firebasestorage.googleapis.com"], // 여기에 사용하고자 하는 호스트 추가
  },
};
