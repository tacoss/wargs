import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const isDev = process.env.ROLLUP_WATCH;
const isProd = process.env.NODE_ENV === 'production';

function bundle(file, format) {
  return {
    sourcemap: false,
    name: 'wargs',
    format,
    file,
  };
}

export default {
  input: 'lib/index.js',
  output: [
    bundle('dist/wargs.js', 'cjs'),
    bundle('dist/wargs.es.js', 'es'),
    bundle('dist/wargs.min.js', 'umd'),
  ],
  plugins: [
    resolve(),
    commonjs(),
    isProd && terser(),
  ],
};
