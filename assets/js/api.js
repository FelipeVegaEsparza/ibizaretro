import { config } from './config.js';
import { secureLog } from './utils.js';

// ==========================================
// CACHE EN MEMORIA
// ==========================================
const cache = new Map();
const CACHE_TTL = {
  basic: 5 * 60 * 1000,      // 5 minutos
  programs: 15 * 60 * 1000,   // 15 minutos
  news: 5 * 60 * 1000,        // 5 minutos
  sponsors: 30 * 60 * 1000,   // 30 minutos
  promotions: 30 * 60 * 1000, // 30 minutos
  social: 60 * 60 * 1000,     // 1 hora
  sonic: 30 * 1000,           // 30 segundos
  default: 10 * 60 * 1000     // 10 minutos default
};

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
}

function setCache(key, data, ttl = CACHE_TTL.default) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl
  });
}

function invalidateCache(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// ==========================================
// CONTROL DE CONCURRENCIA (Rate Limiting)
// ==========================================
const MAX_CONCURRENT = 3;
let activeRequests = 0;
const requestQueue = [];

async function acquireSlot() {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return;
  }
  
  return new Promise(resolve => {
    requestQueue.push(resolve);
  });
}

function releaseSlot() {
  activeRequests--;
  if (requestQueue.length > 0) {
    const next = requestQueue.shift();
    activeRequests++;
    next();
  }
}

// ==========================================
// DEDUPLICACIÓN DE REQUESTS
// ==========================================
const inFlight = new Map();

async function dedupedRequest(key, requestFn) {
  if (inFlight.has(key)) {
    return inFlight.get(key);
  }
  
  const promise = requestFn().finally(() => {
    inFlight.delete(key);
  });
  
  inFlight.set(key, promise);
  return promise;
}

// ==========================================
// RETRY CON BACKOFF EXPONENCIAL
// ==========================================
const DEFAULT_RETRIES = 3;
const DEFAULT_BACKOFF = 1000; // 1 segundo inicial

async function fetchWithRetry(url, options = {}, retries = DEFAULT_RETRIES, backoff = DEFAULT_BACKOFF) {
  await acquireSlot();
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || 10000);
    
    // Remover opciones que no son válidas para fetch
    const fetchOptions = { ...options };
    delete fetchOptions.cacheTTL;
    delete fetchOptions.cache;
    
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      // No reintentar en errores 4xx (cliente)
      if (response.status >= 400 && response.status < 500) {
        const errBody = await response.json().catch(() => null);
        throw new Error(errBody?.error || `HTTP ${response.status}`);
      }
      // Reintentar en errores 5xx (servidor)
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response;
  } catch (error) {
    if (retries <= 0 || error.name === 'AbortError') {
      throw error;
    }
    
    secureLog.warn(`Retry ${DEFAULT_RETRIES - retries + 1} for ${url}: ${error.message}`);
    
    // Esperar con backoff exponencial + jitter
    const delay = backoff * (1 + Math.random() * 0.5);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  } finally {
    releaseSlot();
  }
}

// ==========================================
// FUNCIONES BASE
// ==========================================
let apiBaseCache = null;

async function getApiBase() {
  if (apiBaseCache) return apiBaseCache;
  
  const configData = await config;
  apiBaseCache = `${configData.ipstream_base_url}/${configData.clientId}`;
  return apiBaseCache;
}

async function fetchJSON(url, options = {}) {
  const cacheKey = url;
  const cacheTTL = options.cacheTTL || CACHE_TTL.default;
  const useCache = options.cache !== false;
  
  // Verificar cache
  if (useCache) {
    const cached = getCached(cacheKey);
    if (cached) {
      secureLog.log('Cache hit:', url);
      return cached;
    }
  }
  
  try {
    const response = await fetchWithRetry(url, options);
    const data = await response.json();
    
    // Guardar en cache
    if (useCache) {
      setCache(cacheKey, data, cacheTTL);
    }
    
    return data;
  } catch (error) {
    secureLog.error('API error:', error.message);
    throw error;
  }
}

// ==========================================
// API CLIENT
// ==========================================

export async function getAllClientData() {
  const base = await getApiBase();
  return fetchJSON(`${base}`, { cacheTTL: CACHE_TTL.basic });
}

export async function getBasicData() {
  const base = await getApiBase();
  return fetchJSON(`${base}/basic-data`, { cacheTTL: CACHE_TTL.basic });
}

export async function getVideoStreamingUrl() {
  try {
    const cacheKey = 'videoStreamingUrl';
    const cached = getCached(cacheKey);
    if (cached !== null) return cached;
    
    const basicData = await getBasicData();
    const url = basicData.videoStreamingUrl || null;
    setCache(cacheKey, url, CACHE_TTL.basic);
    return url;
  } catch (error) {
    secureLog.error('Error getting video streaming URL:', error);
    return null;
  }
}

export async function getPrograms() {
  const base = await getApiBase();
  return fetchJSON(`${base}/programs`, { cacheTTL: CACHE_TTL.programs });
}

export async function getNews(page = 1, limit = 10) {
  const base = await getApiBase();
  return fetchJSON(`${base}/news?page=${page}&limit=${limit}`, { cacheTTL: CACHE_TTL.news });
}

export async function getNewsBySlug(slug) {
  const base = await getApiBase();
  return fetchJSON(`${base}/news/${slug}`, { cacheTTL: CACHE_TTL.news });
}

export async function getVideos() {
  const base = await getApiBase();
  return fetchJSON(`${base}/videos`, { cacheTTL: CACHE_TTL.default });
}

export async function getSponsors() {
  const base = await getApiBase();
  return fetchJSON(`${base}/sponsors`, { cacheTTL: CACHE_TTL.sponsors });
}

export async function getPromotions() {
  const base = await getApiBase();
  return fetchJSON(`${base}/promotions`, { cacheTTL: CACHE_TTL.promotions });
}

export async function getPodcasts(page = 1, limit = 10) {
  const base = await getApiBase();
  return fetchJSON(`${base}/podcasts?page=${page}&limit=${limit}`, { cacheTTL: CACHE_TTL.default });
}

export async function getPodcastById(id) {
  const base = await getApiBase();
  return fetchJSON(`${base}/podcasts/${id}`, { cacheTTL: CACHE_TTL.default });
}

export async function getVideocasts(page = 1, limit = 10) {
  const base = await getApiBase();
  return fetchJSON(`${base}/videocasts?page=${page}&limit=${limit}`, { cacheTTL: CACHE_TTL.default });
}

export async function getVideocastById(id) {
  const base = await getApiBase();
  return fetchJSON(`${base}/videocasts/${id}`, { cacheTTL: CACHE_TTL.default });
}

export async function getGalleries() {
  const base = await getApiBase();
  return fetchJSON(`${base}/galleries`, { cacheTTL: CACHE_TTL.default });
}

export async function getAnnouncers() {
  const base = await getApiBase();
  return fetchJSON(`${base}/announcers`, { cacheTTL: CACHE_TTL.default });
}

export async function getPolls(forceRefresh) {
  const base = await getApiBase();
  return fetchJSON(`${base}/polls`, { cacheTTL: CACHE_TTL.default, cache: !forceRefresh });
}

export async function votePoll(pollId, optionId) {
  const base = await getApiBase();
  const response = await fetchWithRetry(`${base}/polls/${pollId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionId })
  });
  return response.json();
}

export async function getEvents() {
  const base = await getApiBase();
  return fetchJSON(`${base}/events`, { cacheTTL: CACHE_TTL.default });
}

export async function registerPwaInstall(deviceId) {
  const base = await getApiBase();
  const response = await fetchWithRetry(`${base}/pwa/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId }),
    retries: 1
  });
  return response.json();
}

export async function getSocialNetworks() {
  try {
    // Intentar obtener desde el endpoint dedicado primero (silenciosamente)
    const base = await getApiBase();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${base}/social-networks`, {
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        const data = await response.json();
        if (data && Object.keys(data).length > 0) {
          return data;
        }
      }
      // Si no es ok (404, etc.), continuar al fallback sin loguear error
    } catch (error) {
      // Silenciar cualquier error del endpoint dedicado
    }
    
    // Fallback: obtener desde el endpoint principal
    const mainData = await getAllClientData();
    if (mainData && mainData.socialNetworks) {
      return mainData.socialNetworks;
    }
    
    // Si no hay redes sociales, retornar objeto vacío sin error
    return {};
  } catch (error) {
    // Silenciar errores completamente
    return {};
  }
}

export async function buildImageUrl(path) {
  if (!path) return null;
  
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  const cacheKey = `img:${path}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  const configData = await config;
  const baseUrl = configData.ipstream_base_url.replace('/api/public', '');
  const fullUrl = `${baseUrl}${path}`;
  
  setCache(cacheKey, fullUrl, CACHE_TTL.social);
  return fullUrl;
}

// ==========================================
// SONICPANEL API
// ==========================================

export async function getSonicPanelInfo() {
  const cacheKey = 'sonicpanel';
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  const configData = await config;
  let port = configData.sonicpanel_port;
  
  if (!port) {
    const streamUrl = configData.sonicpanel_stream_url;
    const portMatch = streamUrl.match(/:(\d+)/);
    port = portMatch ? portMatch[1] : '8018';
  }
  
  const apiUrl = configData.sonicpanel_api_url || `https://stream.ipstream.cl/cp/get_info.php?p=${port}`;
  
  try {
    const response = await fetchWithRetry(apiUrl, { cache: 'no-store', retries: 1, timeout: 5000 });
    const data = await response.json();
    setCache(cacheKey, data, CACHE_TTL.sonic);
    return data;
  } catch (error) {
    secureLog.error('Error fetching SonicPanel info:', error);
    throw error;
  }
}

export async function getCurrentSong() {
  try {
    const configData = await config;
    const projectName = configData.project_name || 'Radio';
    const data = await getSonicPanelInfo();
    
    let artist = 'En Vivo';
    let songTitle = projectName;
    
    if (data.title && data.title.trim() !== '') {
      if (data.title.includes(' - ')) {
        const parts = data.title.split(' - ');
        artist = parts[0].trim();
        songTitle = parts.slice(1).join(' - ').trim();
      } else {
        songTitle = data.title.trim();
      }
    }
    
    if (data.djusername && data.djusername !== 'No DJ' && data.djusername !== 'AutoDJ') {
      artist = data.djusername;
    }
    
    return {
      title: songTitle,
      artist: artist,
      fullTitle: data.title || projectName,
      art: data.art || null,
      listeners: parseInt(data.listeners) || 0,
      uniqueListeners: parseInt(data.ulistener) || 0,
      bitrate: data.bitrate || 'N/A',
      djUsername: data.djusername || null,
      djProfile: data.djprofile || null,
      history: data.history || []
    };
  } catch (error) {
    const configData = await config;
    const projectName = configData.project_name || 'Radio';
    secureLog.error('Error getting current song:', error);
    return {
      title: projectName,
      artist: 'En Vivo',
      fullTitle: projectName,
      art: null,
      listeners: 0,
      uniqueListeners: 0,
      bitrate: 'N/A',
      djUsername: null,
      djProfile: null,
      history: []
    };
  }
}

// ==========================================
// UTILIDADES DE CACHE
// ==========================================

export function clearAPICache() {
  cache.clear();
  apiBaseCache = null;
  secureLog.log('API cache cleared');
}

export function invalidateAPICache(pattern) {
  invalidateCache(pattern);
}

export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}

// Exponer para debugging en desarrollo
if (typeof window !== 'undefined') {
  window.radioAPICache = {
    clear: clearAPICache,
    stats: getCacheStats
  };
}
