import terser from "@rollup/plugin-terser";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import typescript from "rollup-plugin-typescript";
import { visualizer } from "rollup-plugin-visualizer";

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/index.tsx",
  output: {
    file: "public/bundle.js",
    format: "umd",
    globals: {
      d3: "d3",
      "muicss/react": "mui.react",
      react: "React",
      "react-dom": "ReactDOM",
    },
    name: "GlowBabyCharts",
    sourcemap: !production,
  },
  external: ["d3", "muicss/react", "react", "react-dom"],
  plugins: [
    resolve(),
    commonjs(),
    production && terser(),
    typescript(),
    visualizer({
      filename: `./.data/visualizer-${production ? "prod" : "dev"}.html`,
    }),
  ],
};
