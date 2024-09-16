/*module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recess-order',
    'stylelint-prettier/recommended',
  ],
  // add your custom config here
  // https://stylelint.io/user-guide/configuration
  rules: {
    'selector-class-pattern': '^[a-z][a-zA-Z0-9]+$',
  },
};*/

// next.config.mjs
const path = require("path");
//import path from 'path';
//const { fileURLToPath } = require('url');


//const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  sassOptions: {
    // ファイルパスを記載
    prependData: `@import "${path.resolve(__dirname, 'src/styles/_variables.scss')}";`,
  },
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recess-order',
    'stylelint-prettier/recommended',
  ],
  // add your custom config here
  // https://stylelint.io/user-guide/configuration
  rules: {
    'selector-class-pattern': '^[a-z][a-zA-Z0-9]+$',
  },
};

module.exports = nextConfig;
