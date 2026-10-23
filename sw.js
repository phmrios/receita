// sw.js — guarda o site no aparelho para funcionar sem internet.
// Ao alterar qualquer arquivo, aumente a VERSAO para os usuários receberem a atualização.
const VERSAO = "receita-v1";

const ARQUIVOS = [
  "./",
  "index.html",
  "pals.html",
  "cad.html",
  "hidratacao.html",
  "style.css",
  "icon.svg",
  "manifest.webmanifest",
  "js/main.js",
  "js/ui.js",
  "js/calculo.js",
  "js/comum.js",
  "js/encaminhamento.js",
  "js/pals.js",
  "data/medicamentos.json",
  "data/sintomas.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSAO).then((cache) => cache.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n)))),
  );
  self.clients.claim();
});

// Rede primeiro (para pegar doses atualizadas); se falhar, usa a cópia guardada.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        const copia = resp.clone();
        caches.open(VERSAO).then((cache) => cache.put(event.request, copia));
        return resp;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true })),
  );
});
