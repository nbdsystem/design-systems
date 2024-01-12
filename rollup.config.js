import esbuild from 'rollup-plugin-esbuild';
import typescript from 'rollup-plugin-typescript2';

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: ['src/index.ts'],
  external: [],
  plugins: [
    esbuild(),
    typescript({
      tsconfig: 'tsconfig.build.json',
    }),
  ],
  output: {
    dir: 'dist',
    format: 'esm',
  },
};

export default config;
