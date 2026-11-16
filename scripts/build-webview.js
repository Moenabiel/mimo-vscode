const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const watch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: [path.join(__dirname, '..', 'webview', 'app.tsx')],
  bundle: true,
  outfile: path.join(__dirname, '..', 'webview', 'dist', 'app.js'),
  format: 'iife',
  target: 'es2020',
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.css': 'css'
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  minify: !watch,
  sourcemap: watch
};

async function build() {
  // Ensure dist directory exists
  const distDir = path.join(__dirname, '..', 'webview', 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  if (watch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('[webview] Watching for changes...');
  } else {
    await esbuild.build(buildOptions);
    console.log('[webview] Build complete');
  }
}

build().catch(err => {
  console.error('[webview] Build failed:', err);
  process.exit(1);
});
