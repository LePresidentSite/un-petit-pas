"use strict";

const CACHE_VERSION = "un-petit-pas-v21";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./data.js",
  "./db.js",
  "./app.js",
  "./assets/caroline-portrait-v2.jpg?v=20260611",
  "./assets/foret-about.jpg?v=20260611",
  "./assets/brand/logo-symbol.svg",
  "./assets/brand/logo-horizontal.svg",
  "./assets/brand/logo-horizontal-inverse.svg",
  "./assets/brand/logo-square.svg",
  "./assets/brand/logo-square-inverse.svg",
  "./assets/brand/app-icon.svg",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
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
