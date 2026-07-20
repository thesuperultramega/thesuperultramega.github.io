/* One Lever service worker — cache-first app shell */
var CACHE = "one-lever-v1";
var SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      if (hit) {
        // refresh the shell in the background so updates arrive on next open
        e.waitUntil(
          fetch(e.request).then(function (res) {
            if (res && res.ok) {
              return caches.open(CACHE).then(function (c) { return c.put(e.request, res); });
            }
          }).catch(function () {})
        );
        return hit;
      }
      return fetch(e.request).then(function (res) {
        return res;
      }).catch(function () {
        if (e.request.mode === "navigate") return caches.match("./index.html");
      });
    })
  );
});
