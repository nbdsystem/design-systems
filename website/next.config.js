const { GITHUB_PAGES } = process.env;

/**
 * @type {import('next').NextConfig}
 */
const config = {
  basePath: GITHUB_PAGES === 'true' ? '/design-systems' : '',
  output: 'export',
};

export default config;
