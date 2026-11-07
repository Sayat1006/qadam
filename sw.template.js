/* QADAM service worker — жинау кезінде (vite.config.ts) нұсқа мен файлдар тізімі қойылады */
const VERSION = '__VERSION__';
const PRECACHE = __FILES__;
const SHELL = 'qadam-shell-' + VERSION;
const RUNTIME = 'qadam-runtime-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(['/', ...PRECACHE])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('qadam-shell-') && k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // дауыс модельдерін бет өзі кэштейді

  // Беттер: алдымен желі, желі жоқ болса — сақталған қабық
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/', { ignoreSearch: true, ignoreVary: true })),
    );
    return;
  }

  // Хэштелген ассеттер мен үлкен wasm файлдары: алдымен кэш
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/piper/') || url.pathname.startsWith('/ort/')) {
    e.respondWith(
      caches.match(req, { ignoreVary: true, ignoreSearch: false }).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(url.pathname.startsWith('/assets/') ? SHELL : RUNTIME).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Қалғаны: кэштен беріп, фонда жаңарту
  e.respondWith(
    caches.match(req, { ignoreVary: true, ignoreSearch: false }).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    }),
  );
});
