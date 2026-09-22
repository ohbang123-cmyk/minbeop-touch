const CACHE='mync-civil-20260922-v1';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{
  if(e.request.url.startsWith('https://api.openai.com/')) return;
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
