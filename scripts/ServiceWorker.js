const CACHE_NAME = "mynotes-v1";
const ASSETS_TO_CACHE = [
  "../index.html",
  "../manifest.json",
  "../styles/styles.css",
  "./Data.js",
  "./Utils.js",
  "./UI.js",
  "./Editor.js",
  "./Advanced.js",
  "./Main.js",
  "../assets/images/book.svg",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://cdn.jsdelivr.net/npm/marked/marked.min.js",
  "https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.css",
  "https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.js",
];

// 1. 安装事件：预缓存关键资源
self.addEventListener("install", (e) => {
  console.log("[Service Worker] Install");
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching all: app shell and content");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. 激活事件：清理旧缓存
self.addEventListener("activate", (e) => {
  console.log("[Service Worker] Activate");
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. 拦截请求：缓存优先策略 (Cache First, falling back to Network)
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      // 如果缓存中有，直接返回缓存
      if (response) {
        console.log("[Service Worker] Fetching resource: " + e.request.url);
        return response;
      }
      // 否则发起网络请求
      return fetch(e.request);
    })
  );
});
