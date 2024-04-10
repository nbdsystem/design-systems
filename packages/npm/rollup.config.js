import esbuild from 'rollup-plugin-esbuild';
import typescript from 'rollup-plugin-typescript2';
import packageJson from './package.json' assert { type: 'json' };

const external = ['dependencies', 'devDependencies', 'peerDependencies'].flatMap(type => {
  if (packageJson[type]) {
    return Object.keys(packageJson[type]).map((name) => {
      return new RegExp(`^${name}(/.*)?`)
    });
  }
  return [];
});

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: ['src/index.ts'],
  external,
  plugins: [
    typescript({
      tsconfig: 'tsconfig.build.json',
    }),
    esbuild(),
  ],
  output: {
    dir: 'dist',
    format: 'esm',
  },
};

export default config;

