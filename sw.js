// TMRD service worker — guarda a "casca" do app para abrir rápido e sem sinal.
// Ao publicar uma versão nova, mude o número abaixo para forçar a atualização nos celulares.
const VERSION = "tmrd-v27";
const SHELL = ["./", "index.html", "app.js", "config.js", "manifest.webmanifest", "lib/qrcode.js", "lib/supabase.js",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting())); // ignora o cache HTTP
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("supabase.co") || url.hostname.endsWith("supabase.in")) return; // dados sempre da rede
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin) {
    // rede primeiro (pega atualizações), cache se estiver sem sinal; "no-cache" confere com o servidor em vez de usar a cópia de 10 min do navegador
    e.respondWith(fetch(req.url, { cache: "no-cache", credentials: "same-origin" }).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
  } else {
    // fontes e biblioteca do CDN: cache primeiro
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; })));
  }
});
