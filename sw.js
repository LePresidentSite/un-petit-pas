"use strict";

const CACHE_VERSION = "un-petit-pas-v90";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=20260905-active-reward-album-v1",
  "./config.js",
  "./account.js?v=20260619-android-sync-v1",
  "./data.js?v=20260905-active-reward-album-v1",
  "./db.js?v=20260829-gamification-phase3",
  "./app.js?v=20260905-active-reward-album-v1",
  "./assets/caroline-portrait-v2.jpg?v=20260611",
  "./assets/foret-about.jpg?v=20260611",
  "./assets/stickers/petits-bonheurs/etincelle-douce.png",
  "./assets/stickers/petits-bonheurs/coeur-confetti.png",
  "./assets/stickers/petits-bonheurs/maison-tranquille.png",
  "./assets/stickers/petits-bonheurs/lune-berceuse.png",
  "./assets/stickers/petits-bonheurs/liste-fiere.png",
  "./assets/stickers/petits-bonheurs/pousse-courage.png",
  "./assets/stickers/maison-cocon/tasse-calin.png",
  "./assets/stickers/maison-cocon/coussin-doudou.png",
  "./assets/stickers/maison-cocon/chaussettes-repos.png",
  "./assets/stickers/maison-cocon/panier-range.png",
  "./assets/stickers/maison-cocon/lampe-veilleuse.png",
  "./assets/stickers/maison-cocon/balai-courageux.png",
  "./assets/stickers/maison-cocon/petite-cle-du-cocon.png",
  "./assets/stickers/maison-cocon/petite-fenetre-au-soleil.png",
  "./assets/brand/logo-symbol.svg",
  "./assets/brand/logo-horizontal.svg",
  "./assets/brand/logo-horizontal-inverse.svg",
  "./assets/brand/logo-square.svg",
  "./assets/brand/logo-square-inverse.svg",
  "./assets/brand/app-icon.svg",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/favicon.ico",
  "./icons/favicon-16.png",
  "./icons/favicon-32.png",
  "./icons/icon-96.png",
  "./icons/icon-192.png",
  "./icons/icon-256.png",
  "./icons/icon-384.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable.svg",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/badge-96.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key !== CACHE_VERSION;
      }).map(function (key) {
        return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(function (cache) {
            cache.put("./index.html", copy);
          });
          return response;
        })
        .catch(function () {
          return caches.match("./index.html");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        if (!response || response.status !== 200 || response.type === "opaque") return response;
        const copy = response.clone();
        caches.open(CACHE_VERSION).then(function (cache) {
          cache.put(event.request, copy);
        });
        return response;
      });
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const targetUrl = new URL((event.notification.data && event.notification.data.url) || "./#home", self.location.href).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow ? clients.openWindow(targetUrl) : undefined;
    })
  );
});

self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
