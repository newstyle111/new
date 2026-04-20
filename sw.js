// sw.js - Service Worker لتطبيق New Style Pro
const CACHE_NAME = 'newstyle-pro-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js',
  'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;900&display=swap'
];

// تثبيت الـ Service Worker وتخزين الملفات الأساسية
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// تفعيل الـ Service Worker وتنظيف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// استراتيجية: Cache First ثم الشبكة (للملفات الثابتة)
// وللملفات الديناميكية (API/بيانات) نستخدم Network First
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // نتعامل مع طلبات API / localStorage لا يتم اعتراضها، نتركها تمر
  // ولكننا نعترض فقط الملفات الثابتة والصور والخطوط
  if (event.request.method !== 'GET') return;

  // نعترض ملفات التطبيق الرئيسية والـ CSS والـ JS والمكتبات الخارجية
  if (event.request.url.includes('index.html') ||
      event.request.url.includes('.css') ||
      event.request.url.includes('.js') ||
      event.request.url.includes('fonts.googleapis.com') ||
      event.request.url.includes('cdn.tailwindcss.com') ||
      event.request.url.includes('cdnjs.cloudflare.com') ||
      event.request.url.includes('cdn.jsdelivr.net') ||
      event.request.url.includes('cdn.sheetjs.com') ||
      event.request.url.includes('html2pdf.bundle.min.js') ||
      event.request.url.includes('crypto-js.min.js') ||
      event.request.url.includes('chart.umd.min.js') ||
      event.request.url.includes('hammer.min.js') ||
      event.request.url.includes('xlsx.full.min.js') ||
      event.request.url.includes('html2canvas.min.js') ||
      event.request.url.endsWith('.png') ||
      event.request.url.endsWith('.ico') ||
      event.request.url.endsWith('.json') && !event.request.url.includes('api')) {
    
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // إرجاع الملف من الكاش إذا وجد
          if (response) {
            return response;
          }
          // وإلا نجلب من الشبكة ونخزنه في الكاش
          return fetch(event.request).then(
            networkResponse => {
              if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
              }
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              return networkResponse;
            }
          ).catch(() => {
            // في حالة فشل الشبكة، نعرض صفحة أوفلاين
            if (event.request.url.includes('index.html')) {
              return caches.match('/index.html');
            }
            return new Response('غير متصل بالإنترنت', { status: 503 });
          });
        })
    );
  } else {
    // لبقية الطلبات (مثل البيانات المخزنة محلياً لا نتدخل)
    return;
  }
});

// دعم الإشعارات (اختياري)
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png'
  };
  event.waitUntil(
    self.registration.showNotification('New Style Pro', options)
  );
});
