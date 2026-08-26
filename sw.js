const CACHE_NAME = "cosplayhub-v1";
const PAGINAS = [
  "index.html",
  "produtos.html",
  "informacoes-produto.html",
  "carrinho.html",
  "favoritos.html",
  "login.html",
  "cadastro.html",
  "sobre.html",
  "faq.html",
  "trocas.html",
  "404.html",
  "comparar.html",
  "creditos.html",
];
const RECURSOS = [
  "css/style.css",
  "js/data.js",
  "js/app.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([...PAGINAS, ...RECURSOS]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
