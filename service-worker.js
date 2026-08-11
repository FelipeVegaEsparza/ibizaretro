try {
  importScripts('/OneSignalSDKWorker.js');
} catch (e) {
  console.warn('SW: OneSignalSDKWorker.js not found, continuing without it');
}

const CACHE_NAME = 'ipstream-cache-v8';
const OFFLINE_URL = '/offline.html';

// Dominios permitidos para cachear
const CACHEABLE_DOMAINS = [
  self.location.origin,
  'dashboard.ipstream.cl',
  'stream.ipstream.cl',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com'
];

// Archivos esenciales para cachear
const urlsToCache = [
  OFFLINE_URL,
  '/manifest.json',
  '/assets/js/config.js',
  '/config/config.json',
  '/assets/css/loading-styles.css'
];

// Tamaño máximo de archivo a cachear (5MB)
const MAX_CACHE_SIZE = 5 * 1024 * 1024;

// Helpers
function isCacheableUrl(url) {
  try {
    const urlObj = new URL(url);
    return CACHEABLE_DOMAINS.some(domain => 
      urlObj.hostname === domain || 
      urlObj.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

function isCacheableResponse(response) {
  if (!response || !response.ok) return false;
  
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_CACHE_SIZE) {
    return false;
  }
  
  const contentType = response.headers.get('content-type') || '';
  
  // NO cachear respuestas de API JSON (datos dinámicos)
  if (contentType.includes('application/json')) {
    return false;
  }
  
  // NO cachear páginas HTML dinámicas (solo archivos estáticos)
  if (contentType.includes('text/html') && !response.url.includes('/offline.html')) {
    return false;
  }
  
  return true;
}

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('SW: Error caching essential files:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Solo interceptar GET requests
  if (event.request.method !== 'GET') return;
  
  // Ignorar chrome-extension y otros non-http
  if (!event.request.url.startsWith('http')) return;
  
  const url = new URL(event.request.url);
  
  // NO interceptar requests a la API (dejar que pasen directo)
  if (url.pathname.includes('/api/')) {
    return;
  }
  
  // No interceptar requests de terceros no permitidos
  if (!isCacheableUrl(event.request.url)) return;
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si es una respuesta válida y cacheable, clonar y cachear
        if (isCacheableResponse(response)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          }).catch(err => {
            console.error('SW: Error caching response:', err);
          });
        }
        return response;
      })
      .catch(() => {
        // Si fetch falla, intentar servir desde cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Si es una navegación, servir página offline
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            // Para otros requests, retornar error 503
            return new Response('Offline', { 
              status: 503, 
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Background sync
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      Promise.resolve().then(() => {
        console.log('SW: Background sync executed');
      })
    );
  }
});

// Push and notification click handled by OneSignal via OneSignalSDKWorker.js
