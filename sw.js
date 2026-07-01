'use strict';

const CACHE = 'bcp-v37';
const SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './family-fun.json',
  './manifest.webmanifest',
  './logo.svg',
  './icon.svg',
  './favicon.svg',
  './favicon-16.png',
  './favicon-32.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Live data: never cache.
  if (url.origin !== self.location.origin) return;

  // SPA navigations (e.g. /lucht, /uitjes): serve the app shell and let the
  // client route, so deep links work without the 404 round-trip and offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => (res.ok ? res : caches.match('./index.html', { ignoreSearch: true })))
        .catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }

  // App shell: network first so updates land, cache fallback for offline.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
