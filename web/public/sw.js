/**
 * Service worker — כדי שהמשחק יעבוד אופליין.
 *
 * הכול חוץ מהצ'אט רץ על המכשיר, ולכן אחרי ביקור אחד אפשר לשחק
 * גם בלי אינטרנט: בטיסה, ברכב, או כשהוויי-פיי נופל.
 *
 * הקאשינג הוא בזמן ריצה ולא ברשימה קבועה, כי Vite נותן לקבצים
 * שמות עם גיבוב שמשתנים בכל בנייה.
 */

const CACHE = "agali-v1";
// יחסי ל-scope של ה-service worker, כדי שיעבוד גם תחת /<repo>/
const SHELL = ["./", "./index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // בקשות ל-API — של השרת המקומי או של Anthropic — לעולם לא נשמרות
  if (url.origin !== self.location.origin || url.pathname.includes("/api/")) return;

  // ניווט: קודם רשת, ואם אין — האתר מהמטמון
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html").then((cached) => cached ?? Response.error())),
    );
    return;
  }

  // נכסים: מהמטמון מיד, ועדכון ברקע
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached ?? Response.error());
      return cached ?? network;
    }),
  );
});
