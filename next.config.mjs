/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
      config.externals = [...config.externals, { 'fs': 'require("fs")' }];
      return config;
    },
    api: {
      bodyParser: {
        sizeLimit: '10mb',
      },
    }
  };
  
  export default nextConfig;