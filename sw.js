/* The course no longer works offline. Browsers that installed the old offline worker still check
   this file for updates, so it stays as a clean-up: delete every cache, unregister and reload the
   open pages, so they get the current version from the network. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const pages = await self.clients.matchAll({ type: "window" });
    pages.forEach((c) => c.navigate(c.url));
  })());
});
