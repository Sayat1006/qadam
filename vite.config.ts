import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Service worker-ді жинау кезінде жасау: барлық JS/CSS алдын ала кэштеледі (офлайн режим) */
function serviceWorker(): Plugin {
  return {
    name: 'qadam-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle)
        .filter((f) => /\.(js|css)$/.test(f) && !f.includes('heroScene'))
        .map((f) => '/' + f);
      const extra = ['/favicon.svg', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];
      const version = Date.now().toString(36);
      const src = readFileSync('sw.template.js', 'utf8')
        .replace('__VERSION__', version)
        .replace('__FILES__', JSON.stringify([...files, ...extra]));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: src });
    },
  };
}

export default defineConfig({
  plugins: [react(), serviceWorker()],
});
