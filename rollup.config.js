import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript'
import visualizer from 'rollup-plugin-visualizer'

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH

export default {
  input: 'src/main.js',
  output: {
    file: 'public/bundle.js',
    format: 'umd',
    name: 'GlowBabyCharts',
    sourcemap: !production
  },
  plugins: [
    resolve(),
    commonjs(),
    production && terser(),
    typescript(),
    visualizer()
  ]
}
