import * as esbuild from "esbuild";
import { execSync } from "child_process";

console.log("Building client...");
execSync("npx vite build", { stdio: "inherit" });

console.log("Building server...");
await esbuild.build({
  entryPoints: ["server/prodServer.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/index.cjs",
  external: [
    "bcrypt",
    "@neondatabase/serverless",
  ],
  banner: {
    js: 'const __bundled_import_meta_url = require("url").pathToFileURL(__filename).href;',
  },
  define: {
    "import.meta.url": "__bundled_import_meta_url",
  },
});

console.log("Build complete!");
