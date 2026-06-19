// build.js — compiles renderer/app.jsx into renderer/app.js with esbuild.
// React + ReactDOM are loaded as globals (UMD) in index.html, so we DON'T
// bundle them here. The JSX is transformed to React.createElement calls.
const path = require('path');

async function build() {
  let esbuild;
  try {
    esbuild = require('esbuild');
  } catch (e) {
    // esbuild isn't installed (e.g. locked-down PC). A pre-compiled app.js
    // already ships in the zip, so this is non-fatal.
    console.log('[build] esbuild not found — using the pre-compiled app.js that ships with the app.');
    return;
  }

  try {
    await esbuild.build({
      entryPoints: [path.join(__dirname, 'renderer', 'app.jsx')],
      outfile: path.join(__dirname, 'renderer', 'app.js'),
      bundle: true,
      format: 'iife',
      target: ['chrome120'],
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      loader: { '.jsx': 'jsx' },
      logLevel: 'info',
    });
    console.log('[build] renderer/app.jsx -> renderer/app.js  ✓');
  } catch (e) {
    console.error('[build] compile failed:', e.message);
    process.exit(1);
  }
}

build();
