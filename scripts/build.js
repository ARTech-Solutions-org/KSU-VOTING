import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild-wasm';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DIST_ASSETS = path.join(DIST, 'assets');

async function build() {
  console.log('📦 Starting build...');
  const startTime = Date.now();

  // Ensure directories exist
  fs.mkdirSync(DIST_ASSETS, { recursive: true });

  // Copy static assets (logos, svgs, text, background) into dist/assets for Vercel and CDN
  const srcAssets = path.join(ROOT, 'assets');
  if (fs.existsSync(srcAssets)) {
    console.log('📂 Copying static assets to dist/assets...');
    fs.cpSync(srcAssets, DIST_ASSETS, { recursive: true });
  }

  // 1. Initialize esbuild-wasm
  await esbuild.initialize({});

  // 2. Build JavaScript bundle (React + App)
  console.log('⚡ Bundling JavaScript with esbuild-wasm...');
  await esbuild.build({
    entryPoints: [path.join(ROOT, 'src/main.jsx')],
    bundle: true,
    outfile: path.join(DIST_ASSETS, 'index.js'),
    format: 'esm',
    minify: true,
    sourcemap: false,
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx',
      '.png': 'file',
      '.svg': 'file',
      '.jpg': 'file',
    },
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    alias: {
      '@': path.join(ROOT, 'src'),
    },
  });

  // 3. Compile CSS with Tailwind & PostCSS
  console.log('🎨 Compiling Tailwind CSS...');
  const cssInputPath = path.join(ROOT, 'src/index.css');
  const cssInput = fs.readFileSync(cssInputPath, 'utf-8');

  const cssResult = await postcss([
    tailwindcss({
      config: path.join(ROOT, 'tailwind.config.js'),
    }),
    autoprefixer,
  ]).process(cssInput, {
    from: cssInputPath,
    to: path.join(DIST_ASSETS, 'index.css'),
  });

  fs.writeFileSync(path.join(DIST_ASSETS, 'index.css'), cssResult.css, 'utf-8');

  // 4. Generate production index.html
  console.log('📄 Writing production index.html...');
  const buildTime = Date.now();
  const htmlTemplate = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <link rel="icon" type="image/svg+xml" href="/assets/svg/cube-logo-only.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>AI Innovation Competition | مسابقة الابتكار في الذكاء الاصطناعي</title>
    <!-- Preconnect & Google Fonts for Cairo, Barlow Condensed, and Tajawal -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;1,700&family=Cairo:wght@400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/assets/index.css?v=${buildTime}" />
  </head>
  <body class="bg-slate-950 text-white font-sans antialiased overflow-x-hidden selection:bg-cyan-500 selection:text-black">
    <div id="root"></div>
    <script type="module" src="/assets/index.js?v=${buildTime}"></script>
  </body>
</html>`;

  fs.writeFileSync(path.join(DIST, 'index.html'), htmlTemplate, 'utf-8');

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Build completed in ${duration}s! Output written to ${DIST}`);
}

build().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});

