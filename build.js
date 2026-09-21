import * as esbuild from 'esbuild';
import { readdirSync, mkdirSync, rmSync } from 'fs';
import { resolve } from 'path';

const isWatch = process.argv.includes('--watch');

async function run() {
  const commonConfig = {
    bundle: true,
    minify: true,
    sourcemap: true,
  };

  // 1. Core library: IIFE global (window.sceditor) + modern ESM module
  const coreCtx = await esbuild.context({
    ...commonConfig,
    entryPoints: ['src/sceditor.js'],
    outfile: 'minified/sceditor.min.js',
    format: 'iife',
    platform: 'browser',
    mainFields: ['browser', 'module', 'main'],
  });

  const esmCtx = await esbuild.context({
    ...commonConfig,
    entryPoints: ['src/sceditor.js'],
    outfile: 'minified/sceditor.esm.js',
    format: 'esm',
    platform: 'browser',
    mainFields: ['module', 'main'],
  });

  // 2. Format plugins (BBCode, XHTML, etc.)
  const formatEntries = readdirSync('src/formats')
    .filter((f) => f.endsWith('.js'))
    .map((f) => `src/formats/${f}`);

  const formatCtx = await esbuild.context({
    ...commonConfig,
    entryPoints: formatEntries,
    outdir: 'minified/formats',
    outExtension: { '.js': '.min.js' }, // <-- outputs bbcode.min.js & xhtml.min.js
    format: 'iife',
    platform: 'browser',
  });

  // 3. Compile themes natively with esbuild
  const themeEntries = readdirSync('src/themes')
    .filter((f) => f.endsWith('.css'))
    .map((f) => `src/themes/${f}`);

  const themeCtx = await esbuild.context({
    bundle: true,
    minify: true,
    sourcemap: true,
    entryPoints: themeEntries,
    outdir: 'minified/themes',
    outExtension: { '.css': '.min.css' },
    loader: {
      '.png': 'dataurl', // Inlines famfamfam.png directly into the CSS bundle
    },
  });

  if (isWatch) {
    console.log('⚡ Watching for changes with esbuild...');
    await Promise.all([coreCtx.watch(), esmCtx.watch(), formatCtx.watch(), themeCtx.watch()]);
  } else {
    console.log('⚡ Building with esbuild...');
    await Promise.all([coreCtx.rebuild(), esmCtx.rebuild(), formatCtx.rebuild(), themeCtx.rebuild()]);
    await Promise.all([coreCtx.dispose(), esmCtx.dispose(), formatCtx.dispose(), themeCtx.dispose()]);
    console.log('✅ Build complete in minified/');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
