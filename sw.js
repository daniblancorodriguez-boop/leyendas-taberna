/* Service worker: guarda la app en caché para jugar sin conexión (salvo la IA). */
const CACHE = "leyendas-v2";
const ARCHIVOS = ["./", "index.html", "style.css", "data.js", "contenido.js", "arquetipos.js", "dialogo.js", "ai.js", "game.js", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Nunca interceptamos las llamadas a la IA ni nada de otro origen.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  // Red primero (para recibir actualizaciones) y caché como respaldo sin conexión.
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copia));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
  );
});
