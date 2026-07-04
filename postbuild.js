import fs from 'fs';
import path from 'path';

const distPath = './dist';
const swPath = path.join(distPath, 'sw.js');

if (fs.existsSync(swPath)) {
  const assetsDir = path.join(distPath, 'assets');
  let assetsToCache = [
    '/',
    '/index.html',
    '/icon.svg',
    '/manifest.json'
  ];

  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    files.forEach(file => {
      // ignore map files or dotfiles or debug logs
      if (!file.endsWith('.map') && !file.startsWith('.')) {
        assetsToCache.push(`/assets/${file}`);
      }
    });
    console.log('Detected compiled client-side assets inside dist/assets/:', files);
  }

  // Read current sw.js in dist
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Replace the STABLE_ASSESTS block
  const replacement = `const STABLE_ASSESTS = ${JSON.stringify(assetsToCache, null, 2)};`;
  swContent = swContent.replace(/const STABLE_ASSESTS\s*=\s*\[[^\]]*\];/, replacement);
  
  fs.writeFileSync(swPath, swContent, 'utf8');
  console.log('Successfully injected exact built assets into dist/sw.js! Active cached shell count:', assetsToCache.length);
} else {
  console.warn('sw.js was not found in dist/. Skipping post-processing postbuild.');
}
