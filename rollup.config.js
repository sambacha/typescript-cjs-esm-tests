// @ts-check
/** @type {import('rollup').RollupOptions} */
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';

const bundle = (config) => ({
  ...config,
  input: 'src/index.ts',
  external: (id) => !/^[./]/.test(id),
});

export default [
  bundle({
    plugins: [
      esbuild({
        tsconfig: 'tsconfig.json', // default
        minify: process.env.NODE_ENV === 'production',
        optimizeDeps: {
          include: [],
        },
      }),
    ],
    output: [
      {
        file: `dist/index.cjs`,
        format: 'cjs',
        sourcemap: false,
      },
      {
        file: `dist/index.mjs`,
        format: 'es',
        sourcemap: false,
      },
    ],
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: `dist/index.d.ts`,
      format: 'es',
    },
  }),
];