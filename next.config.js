
/** @type {import('next').NextConfig} */
const path = require('path');
module.exports = {
  reactStrictMode: true,
  basePath:
    process.env.GITHUB_REPOSITORY !== undefined
      ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}`
      : '',

  //output: 'export',
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack: config => {
    config.resolve.alias["@"] = path.join(__dirname, "src");
    config.resolve.alias["~"] = path.join(__dirname, "src");
    config.resolve.alias["@api"] = path.join(__dirname, "src/app/api");
    config.resolve.alias["~api"] = path.join(__dirname, "src/app/api");
    return config;
  },
};
