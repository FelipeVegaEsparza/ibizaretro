# Guía para Crear Nuevos Templates

Este documento describe cómo crear un nuevo template para la app de radio usando la estructura centralizada y consumiendo **todas las características** expuestas por la API del dashboard.

---

## Stack del Cliente

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| `api.js` | `/assets/js/api.js` | Cliente HTTP con caché, rate limiting, retry y deduplicación |
| `data-manager.js` | `/assets/js/data-manager.js` | Singleton central con eventos para todos los datos |
| `template-base.js` | `/assets/js/template-base.js` | Clase base que deben extender todos los templates |
| `audio-player.js` | `/assets/js/audio-player.js` | Reproductor de audio (streaming) |
| `social-manager.js` | `/assets/js/social-manager.js` | Renderizado de redes sociales |
| `promotion-popup.js` | `/assets/js/promotion-popup.js` | Popup automático de promociones |
| `utils.js` | `/assets/js/utils.js` | Utilidades generales |

---

## Endpoints de la API Pública

La API base se construye como: `{ipstream_base_url}/{clientId}`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Datos completos del cliente |
| GET | `/basic-data` | Info básica (logo, nombre, URLs streaming) |
| GET | `/social-networks` | Redes sociales |
| GET | `/programs` | Programación |
| GET | `/news?page=&limit=` | Noticias paginadas |
| GET | `/news/{slug}` | Noticia por slug |
| GET | `/videos` | Ranking de videos |
| GET | `/sponsors` | Auspiciadores |
| GET | `/promotions` | Promociones |
| GET | `/podcasts?page=&limit=` | Podcasts paginados |
| GET | `/podcasts/{id}` | Podcast por ID |
| GET | `/videocasts?page=&limit=` | Videocasts paginados |
| GET | `/videocasts/{id}` | Videocast por ID |
| GET | `/galleries` | Galerías de imágenes |
| GET | `/announcers` | Locutores/conductores |
| GET | `/polls` | Encuestas activas |
| GET | `/events` | Eventos y transmisiones especiales |
| POST | `/polls/{id}/vote` | Votar en encuesta (`{ optionId }`) |
| POST | `/pwa/register` | Registrar instalación PWA (`{ deviceId }`) |

---

## Estructura de Archivos del Template

```
templates/
└── [nombre-template]/
    ├── index.html              # Estructura HTML
    └── assets/
        ├── css/
        │   └── style.css       # Estilos específicos
        └── js/
            └── main.js         # Lógica específica (extiende TemplateBase)
```

---

## Paso 1: Crear la Estructura HTML

### Elementos Obligatorios del Reproductor

```html
<!-- Audio element (ID configurable). `crossorigin` es OBLIGATORIO para que la mejora funcione. -->
<audio id="radio-audio" preload="none" crossorigin="anonymous"></audio>

<!-- Botón de play (ID configurable) -->
<button id="play-btn">
  <i class="fas fa-play"></i>
</button>

<!-- Control de volumen (ID configurable) -->
<input type="range" id="volume-slider" min="0" max="100" value="50">

<!-- Elementos de metadata (IDs configurables) -->
<span id="track-title">Radio</span>
<span id="track-artist">En Vivo</span>
<span id="listeners-count">0</span>
<span id="bitrate">N/A</span>
<span id="audio-quality">HD</span>
<img id="track-artwork" src="" style="display: none;">
<div id="default-artwork"></div>

<!-- Logo y nombre del proyecto -->
<img id="news-logo" src="" alt="Logo" style="display: none;">
<span id="footer-title">Radio</span>

<!-- Fecha actual -->
<span id="current-date"></span>

<!-- Redes sociales (IDs configurables) -->
<div id="social-links"></div>
<div id="footer-social"></div>

<!-- Botón de notificaciones push -->
<div id="notification-button-container"></div>
```

### Contenedores de Contenido (Opcionales)

```html
<!-- ============================================ -->
<!-- NOTICIAS                                     -->
<!-- ============================================ -->

<!-- Hero Carousel (slider principal) -->
<div class="hero-swiper">
  <div class="swiper-wrapper" id="hero-carousel"></div>
  <div class="swiper-pagination"></div>
</div>

<!-- Breaking News (ticker) -->
<div id="breaking-ticker"></div>

<!-- Noticias destacadas (grilla) -->
<div class="news-masonry" id="featured-news-grid"></div>

<!-- Todas las noticias (grilla paginada) -->
<div class="news-grid" id="all-news-grid"></div>

<!-- Noticias rápidas -->
<div id="quick-news"></div>

<!-- Modal de detalle de noticia -->
<div id="news-modal" class="modal">
  <div class="modal-content">
    <button class="modal-close">&times;</button>
    <div id="news-modal-body"></div>
  </div>
</div>


<!-- ============================================ -->
<!-- PROGRAMACIÓN                                 -->
<!-- ============================================ -->

<!-- Timeline de programas de hoy -->
<div id="programs-timeline"></div>

<!-- Parrilla completa (7 días) -->
<div id="programs-grid"></div>

<!-- Modal de detalle de programa -->
<div id="program-modal" class="modal">
  <div class="modal-content">
    <button class="modal-close">&times;</button>
    <div id="program-modal-body"></div>
  </div>
</div>


<!-- ============================================ -->
<!-- PODCASTS                                     -->
<!-- ============================================ -->

<!-- Lista de podcasts -->
<div id="podcasts-list"></div>

<!-- Modal de reproductor de podcast -->
<div id="podcast-modal" class="modal">
  <div class="modal-content">
    <button class="modal-close">&times;</button>
    <div id="podcast-modal-body"></div>
    <audio id="podcast-audio" controls></audio>
  </div>
</div>


<!-- ============================================ -->
<!-- VIDECASTS                                    -->
<!-- ============================================ -->

<!-- Lista de videocasts -->
<div id="videocasts-list"></div>

<!-- Modal de reproductor de videocast (YouTube embed) -->
<div id="videocast-modal" class="modal">
  <div class="modal-content modal-lg">
    <button class="modal-close">&times;</button>
    <div id="videocast-modal-body"></div>
  </div>
</div>


<!-- ============================================ -->
<!-- VIDEOS / RANKING MUSICAL                     -->
<!-- ============================================ -->

<!-- Ranking de videos musicales -->
<div id="videos-ranking"></div>

<!-- Modal de video YouTube -->
<div id="video-modal" class="modal">
  <div class="modal-content modal-lg">
    <button class="modal-close">&times;</button>
    <div id="video-modal-body"></div>
  </div>
</div>


<!-- ============================================ -->
<!-- AUSPICIADORES                                -->
<!-- ============================================ -->

<!-- Carrusel de sponsors -->
<div class="sponsors-swiper">
  <div class="swiper-wrapper" id="sponsors-carousel"></div>
  <div class="swiper-pagination"></div>
</div>

<!-- Grilla completa de sponsors -->
<div id="sponsors-grid"></div>


<!-- ============================================ -->
<!-- PROMOCIONES                                  -->
<!-- ============================================ -->

<!-- Popup automático (manejado por PromotionPopup) -->
<div id="promotion-modal" class="modal">
  <div class="modal-content">
    <button class="modal-close">&times;</button>
    <div id="promotion-modal-body"></div>
  </div>
</div>


<!-- ============================================ -->
<!-- GALERÍAS                                     -->
<!-- ============================================ -->

<!-- Lista de galerías -->
<div id="galleries-list"></div>

<!-- Galería de imágenes (lightbox) -->
<div id="gallery-modal" class="modal modal-lg">
  <div class="modal-content">
    <button class="modal-close">&times;</button>
    <div id="gallery-modal-body"></div>
    <div class="gallery-thumbnails" id="gallery-thumbnails"></div>
  </div>
</div>


<!-- ============================================ -->
<!-- LOCUTORES                                    -->
<!-- ============================================ -->

<!-- Parrilla de locutores -->
<div id="announcers-grid"></div>


<!-- ============================================ -->
<!-- ENCUESTAS                                    -->
<!-- ============================================ -->

<!-- Lista de encuestas activas -->
<div id="polls-container"></div>

<!-- Plantilla de encuesta individual -->
<div class="poll-card" id="poll-template" style="display: none;">
  <h3 class="poll-question"></h3>
  <div class="poll-options"></div>
  <div class="poll-results" style="display: none;"></div>
  <p class="poll-voted-msg" style="display: none;">¡Gracias por votar!</p>
</div>


<!-- ============================================ -->
<!-- EVENTOS                                      -->
<!-- ============================================ -->

<!-- Timeline/lista de eventos -->
<div id="events-timeline"></div>


<!-- ============================================ -->
<!-- ÚLTIMOS TEMAS (SonicPanel)                   -->
<!-- ============================================ -->

<!-- Historial de canciones recientes -->
<div id="recent-tracks"></div>


<!-- ============================================ -->
<!-- PWA / NOTIFICACIONES                         -->
<!-- ============================================ -->

<!-- Botón de instalación PWA -->
<div id="pwa-install-button"></div>
```

### Loading Overlay

```html
<div class="loading-overlay" id="loading-overlay">
  <img id="loading-logo-img" src="/assets/icons/icon-512x512.png" alt="Logo">
  <h2 id="loading-title">Cargando...</h2>
  <p id="loading-subtitle">Preparando la experiencia...</p>
</div>
```

---

## Estructura de Datos de Cada Endpoint

### `GET /basic-data`
```json
{
  "projectName": "Radio Nombre",
  "projectDescription": "Descripción de la radio",
  "logoUrl": "/uploads/logo.png",
  "radioStreamingUrl": "https://stream.radio.cl/stream",
  "videoStreamingUrl": "https://video.radio.cl/hls/stream.m3u8"
}
```

### `GET /social-networks`
```json
{
  "facebook": "https://facebook.com/radio",
  "instagram": "https://instagram.com/radio",
  "youtube": "https://youtube.com/@radio",
  "tiktok": "https://tiktok.com/@radio",
  "whatsapp": "+56912345678",
  "x": "https://x.com/radio",
  "twitter": "https://twitter.com/radio",
  "telegram": "https://t.me/radio",
  "linkedin": "https://linkedin.com/company/radio"
}
```

### `GET /programs`
```json
[
  {
    "id": "clxx...",
    "name": "Nombre del Programa",
    "description": "Descripción",
    "imageUrl": "/uploads/program.jpg",
    "startTime": "08:00",
    "endTime": "10:00",
    "weekDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "host": "Conductor Name"
  }
]
```

### `GET /news?page=1&limit=10`
```json
{
  "data": [
    {
      "id": "clxx...",
      "name": "Título de la noticia",
      "slug": "titulo-de-la-noticia",
      "shortText": "Texto corto",
      "description": "Descripción completa (HTML)",
      "longText": "Texto largo (HTML)",
      "imageUrl": "/uploads/news.jpg",
      "createdAt": "2025-01-01T12:00:00.000Z",
      "author": "Autor"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "hasMore": true,
    "totalPages": 5
  }
}
```

### `GET /news/{slug}`
Misma estructura que un item individual de `data[]`.

### `GET /videos`
```json
{
  "data": [
    {
      "id": "clxx...",
      "name": "Nombre del Video",
      "description": "Descripción",
      "videoUrl": "https://youtube.com/watch?v=...",
      "order": 1
    }
  ]
}
```

### `GET /sponsors`
```json
[
  {
    "id": "clxx...",
    "name": "Auspiciador",
    "description": "Descripción",
    "logoUrl": "/uploads/sponsor-logo.png",
    "website": "https://auspiciador.com",
    "address": "Dirección",
    "facebook": "https://facebook.com/auspiciador",
    "youtube": "https://youtube.com/@auspiciador",
    "instagram": "https://instagram.com/auspiciador",
    "tiktok": "https://tiktok.com/@auspiciador",
    "whatsapp": "https://wa.me/...",
    "x": "https://x.com/auspiciador"
  }
]
```

### `GET /promotions`
```json
[
  {
    "id": "clxx...",
    "title": "Título de la Promoción",
    "description": "Descripción",
    "imageUrl": "/uploads/promotion.jpg",
    "link": "https://ejemplo.com/oferta"
  }
]
```

### `GET /podcasts?page=1&limit=10`
```json
{
  "data": [
    {
      "id": "clxx...",
      "title": "Título del Episodio",
      "description": "Descripción (HTML)",
      "shortText": "Texto corto",
      "imageUrl": "/uploads/podcast.jpg",
      "audioUrl": "/uploads/podcast.mp3",
      "duration": "15:30",
      "episodeNumber": 5,
      "season": 1,
      "createdAt": "2025-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 30,
    "hasMore": true,
    "totalPages": 3
  }
}
```

### `GET /podcasts/{id}`
Misma estructura que un item individual de `data[]`.

### `GET /videocasts?page=1&limit=10`
```json
{
  "data": [
    {
      "id": "clxx...",
      "title": "Título del Videocast",
      "description": "Descripción",
      "imageUrl": "/uploads/videocast.jpg",
      "videoUrl": "https://youtube.com/watch?v=...",
      "duration": "10:00",
      "createdAt": "2025-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "hasMore": true,
    "totalPages": 2
  }
}
```

### `GET /videocasts/{id}`
Misma estructura que un item individual de `data[]`.

### `GET /galleries`
```json
[
  {
    "id": "clxx...",
    "name": "Nombre de la Galería",
    "description": "Descripción",
    "imageUrl": "/uploads/gallery-cover.jpg",
    "createdAt": "2025-01-01T12:00:00.000Z",
    "images": [
      {
        "id": "clxx...",
        "imageUrl": "/uploads/gallery/img1.jpg",
        "order": 1
      }
    ]
  }
]
```

### `GET /announcers`
```json
[
  {
    "id": "clxx...",
    "name": "Nombre del Locutor",
    "biography": "Biografía del locutor",
    "photoUrl": "/uploads/announcer.jpg",
    "createdAt": "2025-01-01T12:00:00.000Z"
  }
]
```

### `GET /polls`
```json
[
  {
    "id": "clxx...",
    "question": "¿Cuál es tu género musical favorito?",
    "active": true,
    "createdAt": "2025-01-01T12:00:00.000Z",
    "options": [
      {
        "id": "clxx...",
        "text": "Rock",
        "votes": 42
      },
      {
        "id": "clxx...",
        "text": "Pop",
        "votes": 35
      }
    ]
  }
]
```

### `GET /events`
```json
[
  {
    "id": "clxx...",
    "name": "Nombre del Evento",
    "description": "Descripción",
    "date": "2025-06-15",
    "time": "20:00",
    "location": "Teatro Municipal",
    "imageUrl": "/uploads/event.jpg",
    "createdAt": "2025-01-01T12:00:00.000Z"
  }
]
```

### `POST /polls/{id}/vote`
```json
// Request
{ "optionId": "clxx..." }

// Response
{ "success": true, "message": "Voto registrado" }
```

### `POST /pwa/register`
```json
// Request
{ "deviceId": "uuid-del-dispositivo" }

// Response
{ "success": true }
```

### SonicPanel (canción actual)

Endpoint externo configurado en `config.json` → `sonicpanel_api_url`. Transformado por `getCurrentSong()`:

```json
{
  "title": "Song Title",
  "artist": "Artist Name",
  "fullTitle": "Artist - Song Title",
  "art": "https://.../album-art.jpg",
  "listeners": 42,
  "uniqueListeners": 38,
  "bitrate": "128",
  "djUsername": "DJ Name",
  "djProfile": "https://...",
  "history": [
    "1.) Artist - Song<br>",
    "2.) Artist - Song<br>"
  ]
}
```

---

## Paso 2: Crear el Archivo `main.js`

### Estructura Completa (con todos los módulos)

```javascript
/**
 * Template [Nombre] - Usando todas las características de la API
 */
import TemplateBase from '/assets/js/template-base.js';
import { getDataManager } from '/assets/js/data-manager.js';
import { PromotionPopup } from '/assets/js/promotion-popup.js';

class MiTemplate extends TemplateBase {
  constructor() {
    super({
      // IDs del reproductor de audio
      audioElementId: 'radio-audio',
      playButtonId: 'play-btn',
      volumeSliderId: 'volume-slider',
      defaultVolume: 50,

      // IDs de redes sociales
      socialContainerIds: ['social-links', 'footer-social'],

      // IDs de elementos del DOM
      customDomIds: {
        radioLogo: 'news-logo',
        footerRadioName: 'footer-title',
        trackTitle: 'track-title',
        trackArtist: 'track-artist',
        listenersCount: 'listeners-count',
        bitrate: 'bitrate',
        audioQuality: 'audio-quality',
        trackArtwork: 'track-artwork',
        defaultArtwork: 'default-artwork',
        currentDate: 'current-date',

        // Noticias
        heroCarousel: 'hero-carousel',
        breakingNews: 'breaking-ticker',
        featuredNews: 'featured-news-grid',
        allNewsGrid: 'all-news-grid',
        newsModal: 'news-modal',
        newsModalBody: 'news-modal-body',

        // Programación
        programsTimeline: 'programs-timeline',
        programsGrid: 'programs-grid',
        programModal: 'program-modal',
        programModalBody: 'program-modal-body',

        // Podcasts
        podcastsList: 'podcasts-list',
        podcastModal: 'podcast-modal',
        podcastModalBody: 'podcast-modal-body',
        podcastAudio: 'podcast-audio',

        // Videocasts
        videocastsList: 'videocasts-list',
        videocastModal: 'videocast-modal',
        videocastModalBody: 'videocast-modal-body',

        // Videos
        videosRanking: 'videos-ranking',
        videoModal: 'video-modal',
        videoModalBody: 'video-modal-body',

        // Sponsors
        sponsorsCarousel: 'sponsors-carousel',
        sponsorsGrid: 'sponsors-grid',

        // Promociones
        promotionModal: 'promotion-modal',
        promotionModalBody: 'promotion-modal-body',

        // Galerías
        galleriesList: 'galleries-list',
        galleryModal: 'gallery-modal',
        galleryModalBody: 'gallery-modal-body',
        galleryThumbnails: 'gallery-thumbnails',

        // Locutores
        announcersGrid: 'announcers-grid',

        // Encuestas
        pollsContainer: 'polls-container',

        // Eventos
        eventsTimeline: 'events-timeline',

        // Últimos temas
        recentTracks: 'recent-tracks'
      }
    });

    this.heroSwiper = null;
    this.sponsorsSwiper = null;
    this.currentPage = { news: 1, podcasts: 1, videocasts: 1 };
  }

  async init() {
    await super.init();

    try {
      // Cargar todo el contenido disponible
      await this.loadAllContent();

      // Inicializar popup de promociones
      this.initPromotionPopup();

      // Configurar Swipers/carrousels
      this.setupCarousels();

      // Configurar manejadores de modales
      this.setupModalHandlers();

      console.log('MiTemplate: Template fully initialized!');
    } catch (error) {
      console.error('MiTemplate: Error in template-specific init:', error);
    }
  }

  // ==========================================
  // CARGA DE CONTENIDO
  // ==========================================

  async loadAllContent() {
    try {
      const dm = getDataManager();

      // Carga masiva de todos los contenidos
      await Promise.all([
        this.loadHeroCarousel(),
        this.loadBreakingNews(),
        this.loadFeaturedNews(),
        this.loadAllNews(),
        this.loadProgramsTimeline(),
        this.loadProgramsGrid(),
        this.loadPodcastsList(),
        this.loadVideocastsList(),
        this.loadVideosRanking(),
        this.loadSponsorsCarousel(),
        this.loadSponsorsGrid(),
        this.loadGalleriesList(),
        this.loadAnnouncersGrid(),
        this.loadPolls(),
        this.loadEventsTimeline(),
        this.loadRecentTracks()
      ]);
    } catch (error) {
      console.error('MiTemplate: Error loading content:', error);
    }
  }

  // -------------------- NOTICIAS --------------------

  async loadHeroCarousel() {
    const dm = getDataManager();
    const news = await dm.loadNews(1, 5);
    if (!news.data || !news.data.length) return;
    for (const item of news.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    this.renderHeroCarousel(news.data);
  }

  renderHeroCarousel(news) {
    const container = document.getElementById('hero-carousel');
    if (!container) return;
    container.innerHTML = `<div class="swiper-wrapper">${news.map((item, i) => `
      <div class="swiper-slide" data-slug="${item.slug}">
        <div class="hero-slide" style="background-image: url('${item.imageUrl || ''}')">
          <div class="hero-overlay"></div>
          <div class="hero-content">
            <h2>${item.name}</h2>
            <p>${item.shortText || ''}</p>
          </div>
        </div>
      </div>
    `).join('')}</div>`;
  }

  async loadBreakingNews() {
    const dm = getDataManager();
    const news = await dm.loadNews(1, 3);
    if (!news.data || !news.data.length) return;
    const container = document.getElementById('breaking-ticker');
    if (!container) return;
    container.innerHTML = news.data.map(n => `
      <span class="breaking-item" data-slug="${n.slug}">${n.name}</span>
    `).join('');
  }

  async loadFeaturedNews() {
    const dm = getDataManager();
    const news = await dm.loadNews(1, 6);
    if (!news.data || !news.data.length) return;
    for (const item of news.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    const container = document.getElementById('featured-news-grid');
    if (!container) return;
    container.innerHTML = news.data.map(item => `
      <article class="news-card" data-slug="${item.slug}">
        <img src="${item.imageUrl || '/assets/images/default-news.jpg'}" alt="${item.name}" loading="lazy">
        <h3>${item.name}</h3>
        <p>${item.shortText || ''}</p>
      </article>
    `).join('');
  }

  async loadAllNews() {
    const dm = getDataManager();
    const result = await dm.loadNews(1, 10);
    this.renderNewsGrid(result);
  }

  renderNewsGrid(result) {
    const container = document.getElementById('all-news-grid');
    if (!container || !result.data) return;
    container.innerHTML = result.data.map(item => `
      <article class="news-card" data-slug="${item.slug}">
        <img src="${item.imageUrl ? dm.getImageUrl(item.imageUrl) : '/assets/images/default-news.jpg'}" alt="${item.name}" loading="lazy">
        <h3>${item.name}</h3>
        <p>${item.shortText || ''}</p>
        <small>${new Date(item.createdAt).toLocaleDateString('es-ES')}</small>
      </article>
    `).join('');
  }

  async loadNewsDetail(slug) {
    const dm = getDataManager();
    const news = await dm.loadNewsBySlug(slug);
    if (!news) return;
    if (news.imageUrl) news.imageUrl = await dm.getImageUrl(news.imageUrl);
    const body = document.getElementById('news-modal-body');
    if (!body) return;
    body.innerHTML = `
      <h2>${news.name}</h2>
      ${news.imageUrl ? `<img src="${news.imageUrl}" alt="${news.name}" class="news-detail-img">` : ''}
      <div class="news-content">${news.longText || news.description || news.shortText || ''}</div>
      <small>${new Date(news.createdAt).toLocaleDateString('es-ES')} ${news.author ? `— ${news.author}` : ''}</small>
    `;
    this.openModal('news-modal');
  }

  // -------------------- PROGRAMACIÓN --------------------

  async loadProgramsTimeline() {
    const dm = getDataManager();
    const programs = await dm.loadPrograms();
    if (!programs || !programs.length) return;
    const dayMap = { monday: 'lunes', tuesday: 'martes', wednesday: 'miércoles',
      thursday: 'jueves', friday: 'viernes', saturday: 'sábado', sunday: 'domingo' };
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const todayProgs = programs.filter(p =>
      (p.weekDays || []).some(d => dayMap[d.toLowerCase()] === today) ||
      (p.day && p.day.toLowerCase() === today)
    );
    const container = document.getElementById('programs-timeline');
    if (!container) return;
    container.innerHTML = todayProgs.length
      ? todayProgs.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
          .map(p => `<div class="program-item" data-id="${p.id}">
            <span class="program-time">${p.startTime}</span>
            <span class="program-name">${p.name}</span>
          </div>`).join('')
      : '<p class="empty-state">No hay programas para hoy</p>';
  }

  async loadProgramsGrid() {
    const dm = getDataManager();
    const programs = await dm.loadPrograms();
    if (!programs || !programs.length) return;
    const dayMap = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
      thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' };
    const grouped = {};
    for (const p of programs) {
      const days = p.weekDays || (p.day ? [p.day] : []);
      for (const d of days) {
        const esDay = dayMap[d.toLowerCase()] || d;
        if (!grouped[esDay]) grouped[esDay] = [];
        grouped[esDay].push(p);
      }
    }
    const container = document.getElementById('programs-grid');
    if (!container) return;
    const daysOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    container.innerHTML = daysOrder.map(day => `
      <div class="program-day">
        <h4>${day}</h4>
        ${(grouped[day] || [])
          .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
          .map(p => `<div class="program-item" data-id="${p.id}">
            <span>${p.startTime} - ${p.endTime || ''}</span>
            <strong>${p.name}</strong>
          </div>`).join('') || '<p class="empty-state">Sin programas</p>'}
      </div>
    `).join('');
  }

  // -------------------- PODCASTS --------------------

  async loadPodcastsList() {
    const dm = getDataManager();
    const result = await dm.loadPodcasts(1, 10);
    const container = document.getElementById('podcasts-list');
    if (!container || !result.data) return;
    for (const item of result.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    container.innerHTML = result.data.map(p => `
      <div class="podcast-card" data-id="${p.id}">
        <img src="${p.imageUrl || '/assets/images/default-podcast.jpg'}" alt="${p.title}" loading="lazy">
        <h3>${p.title}</h3>
        <p>${p.shortText || ''}</p>
        <small>${p.duration || ''} · ${new Date(p.createdAt).toLocaleDateString('es-ES')}</small>
      </div>
    `).join('');
  }

  async loadPodcastDetail(id) {
    const dm = getDataManager();
    const podcast = await dm.loadPodcastById(id);
    if (!podcast) return;
    if (podcast.imageUrl) podcast.imageUrl = await dm.getImageUrl(podcast.imageUrl);
    const body = document.getElementById('podcast-modal-body');
    const audio = document.getElementById('podcast-audio');
    if (body) {
      body.innerHTML = `
        <h2>${podcast.title}</h2>
        ${podcast.imageUrl ? `<img src="${podcast.imageUrl}" alt="${podcast.title}">` : ''}
        <p>${podcast.description || podcast.shortText || ''}</p>
      `;
    }
    if (audio) {
      audio.src = podcast.audioUrl || podcast.fileUrl || podcast.url || podcast.audio || '';
      audio.load();
    }
    this.openModal('podcast-modal');
    if (audio) audio.play().catch(() => {});
  }

  // -------------------- VIDECASTS --------------------

  async loadVideocastsList() {
    const dm = getDataManager();
    const result = await dm.loadVideocasts(1, 10);
    const container = document.getElementById('videocasts-list');
    if (!container || !result.data) return;
    container.innerHTML = result.data.map(v => `
      <div class="videocast-card" data-id="${v.id}">
        <div class="videocast-thumb" style="background-image: url('${v.imageUrl || ''}')">
          <div class="play-icon">▶</div>
        </div>
        <h3>${v.title}</h3>
        <small>${v.duration || ''}</small>
      </div>
    `).join('');
  }

  async loadVideocastDetail(id) {
    const dm = getDataManager();
    const vc = await dm.loadVideocastById(id);
    if (!vc) return;
    const body = document.getElementById('videocast-modal-body');
    if (!body) return;
    const videoId = this.extractYouTubeId(vc.videoUrl);
    body.innerHTML = videoId
      ? `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>
         <h2>${vc.title}</h2>
         <p>${vc.description || ''}</p>`
      : `<p>Video no disponible</p>`;
    this.openModal('videocast-modal');
  }

  extractYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  // -------------------- VIDEOS (RANKING) --------------------

  async loadVideosRanking() {
    const dm = getDataManager();
    const result = await dm.loadVideos();
    const container = document.getElementById('videos-ranking');
    if (!container) return;
    const videos = result.data || result || [];
    if (!videos.length) return;
    container.innerHTML = videos.sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(v => `
        <div class="video-ranking-item" data-url="${v.videoUrl}">
          <span class="rank-num">${v.order || ''}</span>
          <div class="rank-info">
            <strong>${v.name}</strong>
            <p>${v.description || ''}</p>
          </div>
        </div>
      `).join('');
  }

  // -------------------- SPONSORS --------------------

  async loadSponsorsCarousel() {
    const dm = getDataManager();
    const sponsors = await dm.loadSponsors();
    if (!sponsors || !sponsors.length) return;
    for (const s of sponsors) {
      if (s.logoUrl) s.logoUrl = await dm.getImageUrl(s.logoUrl);
    }
    const container = document.getElementById('sponsors-carousel');
    if (!container) return;
    container.innerHTML = `<div class="swiper-wrapper">${sponsors.map(s => `
      <div class="swiper-slide">
        <a href="${s.website || '#'}" target="_blank" rel="noopener">
          <img src="${s.logoUrl}" alt="${s.name}" title="${s.name}">
        </a>
      </div>
    `).join('')}</div>`;
  }

  async loadSponsorsGrid() {
    const dm = getDataManager();
    const sponsors = await dm.loadSponsors();
    if (!sponsors || !sponsors.length) return;
    const container = document.getElementById('sponsors-grid');
    if (!container) return;
    container.innerHTML = sponsors.map(s => `
      <div class="sponsor-card">
        ${s.logoUrl ? `<img src="${dm.getImageUrl(s.logoUrl)}" alt="${s.name}" loading="lazy">` : ''}
        <h3>${s.name}</h3>
        <p>${s.description || ''}</p>
        ${s.website ? `<a href="${s.website}" target="_blank">Sitio web</a>` : ''}
      </div>
    `).join('');
  }

  // -------------------- PROMOCIONES --------------------

  initPromotionPopup() {
    try {
      window.promotionPopup = new PromotionPopup(getDataManager());
    } catch (error) {
      console.warn('MiTemplate: Promotion popup not available:', error);
    }
  }

  // -------------------- GALERÍAS --------------------

  async loadGalleriesList() {
    const dm = getDataManager();
    const galleries = await dm.loadGalleries();
    if (!galleries || !galleries.length) return;
    const container = document.getElementById('galleries-list');
    if (!container) return;
    for (const g of galleries) {
      if (g.imageUrl) g.imageUrl = await dm.getImageUrl(g.imageUrl);
    }
    container.innerHTML = galleries.map(g => `
      <div class="gallery-card" data-id="${g.id}">
        ${g.imageUrl ? `<img src="${g.imageUrl}" alt="${g.name}" loading="lazy">` : ''}
        <h3>${g.name}</h3>
        <p>${g.description || ''}</p>
        <small>${(g.images || []).length} imágenes</small>
      </div>
    `).join('');
  }

  async openGallery(id) {
    const dm = getDataManager();
    const galleries = await dm.loadGalleries();
    const gallery = (galleries || []).find(g => g.id === id);
    if (!gallery) return;
    const body = document.getElementById('gallery-modal-body');
    const thumbs = document.getElementById('gallery-thumbnails');
    if (body) {
      body.innerHTML = gallery.images && gallery.images.length
        ? `<img src="${dm.getImageUrl(gallery.images[0].imageUrl)}" class="gallery-main-img">`
        : '<p>Sin imágenes</p>';
    }
    if (thumbs && gallery.images) {
      thumbs.innerHTML = gallery.images
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(img => `<img src="${dm.getImageUrl(img.imageUrl)}" class="gallery-thumb" data-url="${dm.getImageUrl(img.imageUrl)}">`)
        .join('');
    }
    this.openModal('gallery-modal');
  }

  // -------------------- LOCUTORES --------------------

  async loadAnnouncersGrid() {
    const dm = getDataManager();
    const announcers = await dm.loadAnnouncers();
    if (!announcers || !announcers.length) return;
    const container = document.getElementById('announcers-grid');
    if (!container) return;
    for (const a of announcers) {
      if (a.photoUrl) a.photoUrl = await dm.getImageUrl(a.photoUrl);
    }
    container.innerHTML = announcers.map(a => `
      <div class="announcer-card">
        <div class="announcer-photo">
          <img src="${a.photoUrl || '/assets/images/default-avatar.jpg'}" alt="${a.name}" loading="lazy">
        </div>
        <h3>${a.name}</h3>
        <p>${a.biography || ''}</p>
      </div>
    `).join('');
  }

  // -------------------- ENCUESTAS --------------------

  async loadPolls() {
    const dm = getDataManager();
    const polls = await dm.loadPolls();
    if (!polls || !polls.length) return;
    const container = document.getElementById('polls-container');
    if (!container) return;
    container.innerHTML = polls.filter(p => p.active).map(poll => `
      <div class="poll-card" data-id="${poll.id}">
        <h3 class="poll-question">${poll.question}</h3>
        <div class="poll-options">
          ${(poll.options || []).map(opt => `
            <button class="poll-option" data-poll-id="${poll.id}" data-option-id="${opt.id}">
              ${opt.text}
              <span class="poll-bar" style="width: 0%"></span>
              <span class="poll-count">${opt.votes || 0}</span>
            </button>
          `).join('')}
        </div>
        <p class="poll-voted-msg" style="display: none;">¡Gracias por votar!</p>
      </div>
    `).join('');
  }

  async handleVote(pollId, optionId) {
    const dm = getDataManager();
    try {
      await dm.votePoll(pollId, optionId);
      // Recargar encuestas para ver resultados actualizados
      const polls = await dm.loadPolls();
      const poll = (polls || []).find(p => p.id === pollId);
      if (!poll) return;
      const total = (poll.options || []).reduce((sum, o) => sum + (o.votes || 0), 0);
      const card = document.querySelector(`.poll-card[data-id="${pollId}"]`);
      if (!card) return;
      const options = card.querySelectorAll('.poll-option');
      options.forEach((btn, i) => {
        const opt = (poll.options || [])[i];
        if (!opt) return;
        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
        btn.querySelector('.poll-bar').style.width = `${pct}%`;
        btn.querySelector('.poll-count').textContent = `${opt.votes} (${pct}%)`;
        btn.disabled = true;
      });
      card.querySelector('.poll-voted-msg').style.display = 'block';
    } catch (error) {
      console.error('MiTemplate: Error voting:', error);
      alert('Error al registrar tu voto. Intenta de nuevo.');
    }
  }

  // -------------------- EVENTOS --------------------

  async loadEventsTimeline() {
    const dm = getDataManager();
    const events = await dm.loadEvents();
    if (!events || !events.length) return;
    const container = document.getElementById('events-timeline');
    if (!container) return;
    const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    container.innerHTML = sorted.map(e => `
      <div class="event-item">
        <div class="event-date">
          <span class="event-day">${new Date(e.date).getDate()}</span>
          <span class="event-month">${new Date(e.date).toLocaleDateString('es-ES', { month: 'short' })}</span>
        </div>
        <div class="event-info">
          <h3>${e.name}</h3>
          <p>${e.description || ''}</p>
          <small>${e.time || ''}${e.location ? ` · ${e.location}` : ''}</small>
        </div>
      </div>
    `).join('');
  }

  // -------------------- ÚLTIMOS TEMAS --------------------

  async loadRecentTracks() {
    try {
      const dm = getDataManager();
      const song = await dm.loadCurrentSong();
      if (!song || !song.history) return;
      const container = document.getElementById('recent-tracks');
      if (!container) return;
      container.innerHTML = song.history.map(track => `
        <div class="track-item">${track}</div>
      `).join('');
    } catch (error) {
      // Silencioso — no crítico
    }
  }

  // ==========================================
  // CONFIGURACIÓN DE CAROUSELES
  // ==========================================

  setupCarousels() {
    if (typeof Swiper === 'undefined') return;
    setTimeout(() => {
      const heroSlides = document.querySelectorAll('#hero-carousel .swiper-slide');
      if (document.querySelector('.hero-swiper') && heroSlides.length > 0 && !this.heroSwiper) {
        try {
          this.heroSwiper = new Swiper('.hero-swiper', {
            loop: heroSlides.length > 1,
            autoplay: { delay: 5000 },
            pagination: { el: '.swiper-pagination', clickable: true }
          });
        } catch (e) {
          console.warn('Error initializing hero carousel:', e.message);
        }
      }
      const sponsorSlides = document.querySelectorAll('#sponsors-carousel .swiper-slide');
      if (document.querySelector('.sponsors-swiper') && sponsorSlides.length > 0 && !this.sponsorsSwiper) {
        try {
          this.sponsorsSwiper = new Swiper('.sponsors-swiper', {
            loop: sponsorSlides.length > 1,
            autoplay: { delay: 3000 },
            slidesPerView: 'auto',
            spaceBetween: 20
          });
        } catch (e) {
          console.warn('Error initializing sponsors carousel:', e.message);
        }
      }
    }, 1000);
  }

  // ==========================================
  // MANEJADORES DE MODALES Y EVENTOS
  // ==========================================

  setupModalHandlers() {
    // Cerrar modales al hacer clic en X o fuera del contenido
    document.querySelectorAll('.modal').forEach(modal => {
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeModal(modal.id));
      }
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal.id);
      });
    });

    // Delegación de eventos para contenido dinámico
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-slug]');
      if (target) {
        e.preventDefault();
        this.loadNewsDetail(target.dataset.slug);
        return;
      }

      const podcastCard = e.target.closest('[data-id]');
      if (podcastCard && podcastCard.closest('#podcasts-list')) {
        this.loadPodcastDetail(podcastCard.dataset.id);
        return;
      }

      const videocastCard = e.target.closest('[data-id]');
      if (videocastCard && videocastCard.closest('#videocasts-list')) {
        this.loadVideocastDetail(videocastCard.dataset.id);
        return;
      }

      const videoItem = e.target.closest('[data-url]');
      if (videoItem && videoItem.closest('#videos-ranking')) {
        e.preventDefault();
        const videoId = this.extractYouTubeId(videoItem.dataset.url);
        if (videoId) {
          const body = document.getElementById('video-modal-body');
          if (body) {
            body.innerHTML = `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
          }
          this.openModal('video-modal');
        }
        return;
      }

      const galleryCard = e.target.closest('[data-id]');
      if (galleryCard && galleryCard.closest('#galleries-list')) {
        this.openGallery(galleryCard.dataset.id);
        return;
      }

      const galleryThumb = e.target.closest('.gallery-thumb');
      if (galleryThumb) {
        const main = document.querySelector('.gallery-main-img');
        if (main) main.src = galleryThumb.dataset.url;
        return;
      }

      const pollOption = e.target.closest('.poll-option');
      if (pollOption && !pollOption.disabled) {
        this.handleVote(pollOption.dataset.pollId, pollOption.dataset.optionId);
        return;
      }
    });
  }

  // ==========================================
  // UTILIDADES DE MODAL
  // ==========================================

  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
  }

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
    // Pausar audio si se cierra el modal de podcast
    const audio = document.getElementById('podcast-audio');
    if (audio && !audio.paused) audio.pause();
  }

  // ==========================================
  // GESTIÓN DEL COVER ARTWORK
  // ==========================================
  //
  // TemplateBase ya gestiona el artwork automáticamente para los elementos
  // estándar (trackArtwork / defaultArtwork). Solo necesitas los helpers
  // _setHeroCover / _showHeroDefault si tu template tiene elementos
  // de cover personalizados (hero background, dual artworks, etc.).
  //
  // this._radioCoverUrl está disponible como fallback desde la carga
  // de datos básicos (lo resuelve TemplateBase.loadBasicData).
  //
  // Patrón recomendado cuando sobrescribes onCurrentSongLoaded:
  //
  // onCurrentSongLoaded(songData) {
  //   const artUrl = songData.art || '';
  //
  //   if (artUrl && artUrl !== coverImg?.src) {
  //     const img = new Image();
  //     img.onload = () => this._setHeroCover(artUrl);
  //     img.onerror = () => {
  //       if (this._radioCoverUrl) this._setHeroCover(this._radioCoverUrl);
  //       else this._showHeroDefault();
  //     };
  //     img.src = artUrl;
  //   } else if (!artUrl) {
  //     if (this._radioCoverUrl && coverImg?.src !== this._radioCoverUrl) {
  //       this._setHeroCover(this._radioCoverUrl);
  //     } else if (!this._radioCoverUrl) {
  //       this._showHeroDefault();
  //     }
  //   }
  // }

  // ==========================================
  // HOOKS PARA SOBRESCRIBIR
  // ==========================================

  onBasicDataLoaded(data) {
    // Si tu template tiene elementos de cover personalizados (distintos
    // a trackArtwork / defaultArtwork), usa this._radioCoverUrl aquí:
    //
    // if (this._radioCoverUrl) {
    //   const coverImg = document.getElementById('mi-cover');
    //   const heroBg = document.getElementById('mi-hero-bg');
    //   coverImg.src = this._radioCoverUrl;
    //   coverImg.style.display = 'block';
    //   heroBg.style.backgroundImage = 'url(' + this._radioCoverUrl + ')';
    // }
  }

  onSocialNetworksLoaded(data) {
    // Custom logic después de cargar redes sociales
  }

  onCurrentSongLoaded(songData) {
    const listenersEl = document.getElementById('sidebar-listeners');
    if (listenersEl) listenersEl.textContent = songData.listeners || '0';
    const historyEl = document.getElementById('recent-tracks');
    if (historyEl && songData.history) {
      // Actualizar tracks recientes en vivo
    }
  }

  onAudioPlay() {
    super.onAudioPlay();
  }

  onAudioPause() {
    super.onAudioPause();
  }

  onAudioError(error) {
    console.error('MiTemplate: Audio error:', error);
  }

  onVolumeChange(value) {
    // Custom logic al cambiar volumen
  }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.miTemplate = new MiTemplate();
    await window.miTemplate.init();
  } catch (error) {
    console.error('MiTemplate: Error creating instance:', error);
  }
});

window.addEventListener('beforeunload', () => {
  if (window.miTemplate) {
    window.miTemplate.destroy();
  }
});

export default MiTemplate;
```

---

## Referencia Completa de la API

### Funciones de `api.js`

| Función | Descripción |
|---------|-------------|
| `getAllClientData()` | Datos completos del cliente |
| `getBasicData()` | Info básica (logo, nombre, URLs streaming) |
| `getVideoStreamingUrl()` | URL de video streaming (HLS) |
| `getPrograms()` | Programación completa |
| `getNews(page, limit)` | Noticias paginadas |
| `getNewsBySlug(slug)` | Noticia por slug |
| `getVideos()` | Ranking de videos musicales |
| `getSponsors()` | Auspiciadores |
| `getPromotions()` | Promociones |
| `getPodcasts(page, limit)` | Podcasts paginados |
| `getPodcastById(id)` | Podcast por ID |
| `getVideocasts(page, limit)` | Videocasts paginados |
| `getVideocastById(id)` | Videocast por ID |
| `getGalleries()` | Galerías de imágenes |
| `getAnnouncers()` | Locutores |
| `getPolls()` | Encuestas activas |
| `votePoll(pollId, optionId)` | Votar en encuesta |
| `getEvents()` | Eventos |
| `registerPwaInstall(deviceId)` | Registrar instalación PWA |
| `getSocialNetworks()` | Redes sociales |
| `getSonicPanelInfo()` | Estado del stream (SonicPanel) |
| `getCurrentSong()` | Canción actual (transformada) |
| `buildImageUrl(path)` | Construye URL absoluta de imagen |
| `clearAPICache()` | Limpia toda la caché |
| `invalidateAPICache(pattern)` | Invalida caché por patrón |
| `getCacheStats()` | Estadísticas de caché |

### Métodos de `DataManager`

| Método | Descripción | Evento emitido |
|--------|-------------|----------------|
| `loadBasicData()` | Carga datos básicos | `basicDataLoaded` |
| `loadSocialNetworks()` | Carga redes sociales | `socialNetworksLoaded` |
| `loadPrograms()` | Carga programas | `programsLoaded` |
| `loadNews(page, limit)` | Carga noticias | `newsLoaded` |
| `loadNewsBySlug(slug)` | Carga noticia por slug | `newsBySlugLoaded` |
| `loadPodcasts(page, limit)` | Carga podcasts | `podcastsLoaded` |
| `loadVideocasts(page, limit)` | Carga videocasts | `videocastsLoaded` |
| `loadPodcastById(id)` | Carga podcast por ID | `podcastLoaded` |
| `loadVideocastById(id)` | Carga videocast por ID | `videocastLoaded` |
| `loadVideos()` | Carga ranking de videos | `videosLoaded` |
| `loadSponsors()` | Carga auspiciadores | `sponsorsLoaded` |
| `loadPromotions()` | Carga promociones | `promotionsLoaded` |
| `loadGalleries()` | Carga galerías | `galleriesLoaded` |
| `loadAnnouncers()` | Carga locutores | `announcersLoaded` |
| `loadPolls()` | Carga encuestas activas | `pollsLoaded` |
| `loadEvents()` | Carga eventos | `eventsLoaded` |
| `votePoll(pollId, optionId)` | Vota en una encuesta | `pollVoted` |
| `registerPwaInstall(deviceId)` | Registra instalación PWA | — |
| `loadCurrentSong()` | Carga canción actual | `currentSongLoaded` |
| `loadVideoStreamUrl()` | Carga URL de video streaming | `videoStreamUrlLoaded` |
| `getImageUrl(path)` | Construye URL absoluta de imagen | — |
| `loadAllBasicData()` | Carga datos básicos + redes + canción | — |
| `loadAllContent()` | Carga **todos** los contenidos disponibles | — |
| `startSonicPanelUpdates(interval)` | Inicia polling cada N ms | — |
| `stopSonicPanelUpdates()` | Detiene polling | — |
| `clearCache()` | Limpia caché de API y datos internos | — |

### Getters de `DataManager`

```javascript
getBasicData()
getSocialNetworks()
getPrograms()
getNews()
getPodcasts()
getVideocasts()
getVideos()
getSponsors()
getPromotions()
getGalleries()
getAnnouncers()
getPolls()
getEvents()
getCurrentSong()
getVideoStreamUrl()
```

---

## Métodos Disponibles en `TemplateBase`

### Métodos de Setup (heredados automáticamente)

| Método | Descripción |
|--------|-------------|
| `setupNavigation()` | Menú hamburguesa responsive |
| `setupFilters()` | Filtros de contenido |
| `setupTabs()` | Sistema de tabs |
| `showTab(tabName)` | Mostrar tab específico |
| `setupModales()` | Inicialización de modales |
| `setupAnimations()` | Animaciones (AOS) |
| `setupRippleEffects()` | Efectos ripple en botones |
| `setCurrentDate()` | Renderiza fecha actual en español |
| `toggleAudio()` | Play/pause del stream |
| `audioPlayer.setVolume(value)` | Ajustar volumen |
| `audioPlayer.setStreamUrl(url)` | Establecer URL de stream |
| `audioPlayer.play()` | Iniciar reproducción |
| `audioPlayer.pause()` | Pausar reproducción |

---

## Gestión del Cover Artwork (Hero / Track)

### Comportamiento automático en `TemplateBase`

La clase base maneja el cover artwork de forma transparente:

1. **Carga inicial** (`loadBasicData`):
   - Resuelve `coverUrl` (o `logoUrl` como fallback) y lo almacena en `this._radioCoverUrl`
   - Si el template usa los IDs estándar (`trackArtwork` / `defaultArtwork`), asigna el cover de la radio como artwork inicial — sin imagen rota

2. **Actualización desde SonicPanel** (`updateCurrentSongDisplay`):
   - Si `songData.art` existe: precarga con `new Image()` + `onload` / `onerror`
   - Si `songData.art` falla: cae automáticamente a `this._radioCoverUrl`
   - Si no hay `songData.art`: mantiene el cover de la radio en lugar de ocultarlo

### Templates con elementos de cover personalizados

Si tu template tiene elementos de cover distintos a los IDs estándar (ej: `#cover-artwork` + `#hero-player-bg` como en los templates app, covered, moderno, tradicional), debes:

1. **Sobrescribir `onBasicDataLoaded`** — mostrar el cover de la radio como inicial:
```js
onBasicDataLoaded(data) {
  if (this._radioCoverUrl) {
    const coverImg = document.getElementById('mi-cover-img');
    const defaultEl = document.getElementById('mi-cover-default');
    const heroBg = document.getElementById('mi-hero-bg');
    if (coverImg) {
      coverImg.src = this._radioCoverUrl;
      coverImg.style.display = 'block';
      if (defaultEl) defaultEl.style.display = 'none';
    }
    if (heroBg) {
      heroBg.style.backgroundImage = 'url(' + this._radioCoverUrl + ')';
      heroBg.classList.add('loaded');
    }
  }
}
```

2. **Implementar helpers** `_setHeroCover(url)` y `_showHeroDefault()` para reutilizar la lógica.

3. **En `onCurrentSongLoaded`**, usar el patrón con `onerror`:
```js
onCurrentSongLoaded(songData) {
  const artUrl = songData.art || '';
  const coverImg = document.getElementById('mi-cover-img');

  if (artUrl && artUrl !== coverImg?.src) {
    const img = new Image();
    img.onload = () => this._setHeroCover(artUrl);
    img.onerror = () => {
      if (this._radioCoverUrl) this._setHeroCover(this._radioCoverUrl);
      else this._showHeroDefault();
    };
    img.src = artUrl;
  } else if (!artUrl) {
    if (this._radioCoverUrl && coverImg?.src !== this._radioCoverUrl) {
      this._setHeroCover(this._radioCoverUrl);
    } else if (!this._radioCoverUrl) {
      this._showHeroDefault();
    }
  }
}
```

### Métodos para Sobrescribir en el Template

| Método | Cuándo se ejecuta |
|--------|-------------------|
| `onBasicDataLoaded(data)` | Después de cargar datos básicos |
| `onSocialNetworksLoaded(data)` | Después de cargar redes sociales |
| `onCurrentSongLoaded(songData)` | Cada 30s (polling SonicPanel) |
| `onAudioPlay()` | Cuando inicia la reproducción |
| `onAudioPause()` | Cuando se pausa |
| `onAudioError(error)` | Cuando hay un error de audio |
| `onVolumeChange(value)` | Cuando cambia el volumen |
| `loadContent()` | Cargar contenido adicional personalizado |
| `applyFilter(filter)` | Aplicar filtro personalizado |
| `destroy()` | Limpieza al cerrar/destruir el template |

---

## IDs de Elementos del DOM

| Elemento | ID por defecto | Requerido |
|----------|----------------|-----------|
| Audio | `radio-audio` | Sí |
| Play button | `play-btn` | Sí |
| Volume slider | `volume-slider` | Sí |
| Track title | `track-title` | Sí |
| Track artist | `track-artist` | Sí |
| Oyentes | `listeners-count` | No |
| Bitrate | `bitrate` | No |
| Calidad | `audio-quality` | No |
| Artwork | `track-artwork` | No |
| Default artwork | `default-artwork` | No |
| | | |
| Cover de radio | *(automático)* | — |
| | `this._radioCoverUrl` se asigna como artwork inicial y fallback ante errores de carga o ausencia de `songData.art` |
| Logo | `radio-logo` | No |
| Footer name | `footer-radio-name` | No |
| Fecha actual | `current-date` | No |
| Social links | `social-links` | No |
| Footer social | `footer-social` | No |
| Hero carousel | `hero-carousel` | No |
| Breaking news | `breaking-ticker` | No |
| Featured news | `featured-news-grid` | No |
| All news grid | `all-news-grid` | No |
| Quick news | `quick-news` | No |
| News modal body | `news-modal-body` | No |
| Programs timeline | `programs-timeline` | No |
| Programs grid | `programs-grid` | No |
| Podcasts list | `podcasts-list` | No |
| Podcast modal body | `podcast-modal-body` | No |
| Podcast audio | `podcast-audio` | No |
| Videocasts list | `videocasts-list` | No |
| Videocast modal body | `videocast-modal-body` | No |
| Videos ranking | `videos-ranking` | No |
| Video modal body | `video-modal-body` | No |
| Sponsors carousel | `sponsors-carousel` | No |
| Sponsors grid | `sponsors-grid` | No |
| Promotion modal body | `promotion-modal-body` | No |
| Galleries list | `galleries-list` | No |
| Gallery modal body | `gallery-modal-body` | No |
| Gallery thumbnails | `gallery-thumbnails` | No |
| Announcers grid | `announcers-grid` | No |
| Polls container | `polls-container` | No |
| Events timeline | `events-timeline` | No |
| Recent tracks | `recent-tracks` | No |
| Notification button | `notification-button-container` | No |
| PWA install button | `pwa-install-button` | No |
| Loading overlay | `loading-overlay` | No |
| Loading logo | `loading-logo-img` | No |
| Loading title | `loading-title` | No |
| Loading subtitle | `loading-subtitle` | No |

---

## Integración de Notificaciones Push (OneSignal)

Agregar en el `<head>` junto a los otros CSS compartidos:

```html
<link rel="stylesheet" href="/assets/css/notification-button.css">
```

Agregar un `<div>` con `id="notification-button-container"` en el lugar donde quieras que aparezca el botón.

```html
<div id="notification-button-container"></div>
```

Agregar antes del `main.js` del template:

```html
<script type="module" src="/assets/js/onesignal-init.js"></script>
```

### Comportamiento

- Si el cliente tiene `oneSignalAppId` configurado, el SDK se carga automáticamente y el botón se muestra.
- Si no está configurado, el botón no se renderiza (sin errores).
- El botón muestra "Activar notificaciones" y cambia a "Notificaciones activadas" tras aceptar.

### Ejemplo de integración completa en `index.html`

```html
<head>
  <link rel="stylesheet" href="/assets/css/notification-button.css">
  <link rel="stylesheet" href="/assets/css/promotion-popup.css">
  <link rel="stylesheet" href="/assets/css/pwa-installer.css">
</head>
<body>
  <header>
    <div class="header-actions">
      <div id="notification-button-container"></div>
      <div class="social-links" id="social-links"></div>
    </div>
  </header>

  <!-- Contenido del template aquí -->

  <script src="/assets/js/pwa-installer.js?v=3"></script>
  <script type="module" src="/assets/js/onesignal-init.js"></script>
  <script type="module" src="assets/js/main.js"></script>
</body>
```

> **Nota**: `OneSignalSDKWorker.js` ya existe en `public/` y es servido automáticamente.

---

## Ejemplo de Template Mínimo

```javascript
import TemplateBase from '/assets/js/template-base.js';

class MiTemplate extends TemplateBase {
  constructor() {
    super({
      audioElementId: 'radio-audio',
      playButtonId: 'play-btn',
      volumeSliderId: 'volume-slider',
      socialContainerIds: ['social-links']
    });
  }

  async init() {
    await super.init();
    console.log('MiTemplate: Listo!');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  window.miTemplate = new MiTemplate();
  await window.miTemplate.init();
});

export default MiTemplate;
```

---

## Audio Enhancer (Mejora de Calidad del Stream)

### ¿Qué hace?

Procesa el audio del stream de radio en vivo con una cadena tipo "radio comercial FM": **EQ 4 bandas → Compressor → Limiter → Output Gain**. Se aplica solo al `<audio>` principal del stream (no a podcasts ni a `<video>` del TV). Sin recargar ni re-buferar: los nodos siempre están conectados y el bypass se hace animando un `GainNode` (crossfade ~50 ms).

### ¿Cómo se activa?

Se activa automáticamente si `config/config.json` tiene el bloque:

```json
{
  "audio_enhancer": {
    "enabled": true,
    "preset": "enhanced"
  }
}
```

- `enabled` (bool, default `true`): on/off por cliente desde el servidor.
- `preset` (string, default `"enhanced"`): uno de `original | enhanced | flat | vocal | bass | soft`.

Si el bloque **no existe**, el enhancer se activa con defaults (`enabled: true`, `preset: "enhanced"`). Si solo falta un campo, se aplica el default para ese campo.

### Presets disponibles

| Preset      | Filosofía | Uso |
|-------------|-----------|-----|
| `original`  | Sin procesamiento. Solo control de volumen (userGain). Cadena: source → userGain → destination. | Comparación A/B, audiófilos, "no toques nada". |
| `enhanced`  | **Hi-Fi.** EQ sutil + compresor broadband transparente y adaptativo + limitador brick-wall con look-ahead. Sin widener, sin multibanda. | **Default recomendado.** Cercano a la calidad de VLC / Foobar2000 / Spotify. |
| `flat`      | Radio loud suave. EQ plano, compresor 2:1, sin limitador. | Normalización ligera sin colorear. |
| `vocal`     | Radio loud agresivo. EQ para talk radio, compresor 2.5:1, limitador. | Talk radio, podcasts, noticias. |
| `bass`      | Radio loud con graves. EQ con +9 dB @ 60 Hz, compresor 2:1. | Reggaetón, electrónica. |
| `soft`      | Audio de fondo. EQ suave, limitador conservador, out −3 dB. | Madrugada, audio pasivo. |

### `enhanced` — Hi-Fi en detalle (default)

Diseñado para acercarse a la calidad de reproductores profesionales como VLC, Foobar2000 o Spotify Desktop. Prioriza sonido limpio y natural sobre loudness.

**EQ — corrección sutil, no coloración:**

| Slot | Frecuencia | Ganancia | Q | Propósito |
|------|-----------|----------|---|-----------|
| low | 80 Hz | +1 dB (lowshelf) | — | Calidez sutil |
| mid | 300 Hz | −1.5 dB (peaking) | 0.7 | Quita "barro" en medios-bajos |
| pres | 3 kHz | +1 dB (peaking) | 0.8 | Presencia vocal sutil |
| high | 12 kHz | +0.5 dB (highshelf) | — | Aire por encima de la sibilancia (5-8 kHz) |

**Compresor broadband — transparente y adaptativo:**

- Ratio: 2:1
- Attack: 25 ms (deja pasar transientes)
- Release: 150 ms (natural, sin bombeo)
- Knee: 12 dB (transición muy suave)
- **Threshold adaptativo**: el sistema mide el RMS del audio de entrada cada 150 ms y ajusta el threshold automáticamente:
  - Audio fuerte / bien masterizado (RMS > −12 dBFS) → threshold sube a −6 dB → el compresor no actúa
  - Audio bajo / pobre (RMS < −28 dBFS) → threshold baja a −24 dB → compresión gentil compensa
  - Entre medio: interpolación lineal
  - Cambios suavizados con `setTargetAtTime` (sin clicks)

Esto cumple el principio: **mínimo procesamiento si el audio ya es bueno, corrección progresiva si tiene deficiencies.** La EQ queda fija y muy sutil porque la coloración perceptible al cambiar de preset es peor que una corrección suave y consistente.

**Limitador brick-wall con look-ahead:**

- Threshold: **−0.5 dBFS** (techo máximo de la señal procesada)
- Ratio: 20:1 (hard knee, brick-wall efectivo)
- Attack: 0.5 ms
- Release: 50 ms
- **Look-ahead de 5 ms**: un `DelayNode` antes del limitador retrasa la señal 5 ms, así el limitador ve el pico antes de que llegue y puede reaccionar sin distorsión en transientes. Costo: +5 ms de latencia total (imperceptible para música).

**OutGain: +0.5 dB** (boost makeup después del limitador). Combinado con el limitador a −0.5 dBFS, el techo final de la señal queda en 0 dBFS (sin clipping). El limitador hace el trabajo pesado y el outGain empuja el nivel promedio ~1 dB por encima de la versión anterior.

**Cadena completa del `enhanced`:**

```
source → analyser (observación) → EQ (4 bandas sutil)
      → compressor (1 banda, ratio 2:1, threshold adaptativo)
      → delay 5ms (look-ahead) → limiter (−0.5 dBFS, ratio 20:1)
      → outGain (+0.5 dB) → userGain → analyser (VU) → destination
```

**AudioContext**: `new AudioContext({ latencyHint: 'interactive' })` para menor latencia. No se fuerza `sampleRate` (el browser elige el nativo del device para evitar resampling innecesario). Web Audio procesa en 32-bit float por default en todos los browsers modernos.

**Por qué se acerca a Hi-Fi:**
- EQ tan sutil que no colorea el material
- Compresor 2:1 es prácticamente "volume rider" — solo controla picos
- Look-ahead evita distorsión en transientes
- OutGain 0 dB = nivel natural, sin empuje artificial
- Sin widener = imagen estéreo intacta
- Sin multibanda agresiva = dinámica preservada
- Procesamiento en 32-bit float (default Web Audio)

### Requisitos en el template

**El `<audio id="radio-audio">` (o el id configurado en `audioElementId`) DEBE tener `crossorigin="anonymous"`.** Sin este atributo, cuando el enhancer (o el VU meter compartido) crea un `MediaElementSource` sobre el elemento, el navegador silencia la salida con un warning `MediaElementAudioSource outputs zeroes due to CORS access restrictions`. El stream se carga pero no se oye nada.

El servidor de streaming (ipstream.cl) ya envía `Access-Control-Allow-Origin: *`, así que no hay riesgo al agregar el atributo. Si en el futuro cambiás de proveedor de stream, verificá primero en DevTools → Network → response headers del stream que el header CORS esté presente antes de deployar.

### Habilitar la mejora en un template nuevo

1. Asegurarse de que el `<audio>` del stream principal tenga `crossorigin="anonymous"` (ver snippet actualizado arriba en "Elementos Obligatorios del Reproductor").
2. (Opcional) Editar `config/config.json` para fijar `audio_enhancer.preset` según el público de la radio. Para Hi-Fi: `"preset": "enhanced"`. Para sin procesamiento: `"preset": "original"`.
3. Si el template usa un id distinto a `radio-audio` (caso `blue` que usa `news-audio`), no hay cambios extra: el enhancer se engancha al elemento que el `AudioPlayer` del template controle.

### Inspección y control en runtime

El módulo expone el singleton como `window.__audioEnhancer` apenas se carga, así que no hace falta importar nada en la consola. Comandos disponibles:

```js
// Estado actual
__audioEnhancer.getState();
// → { enabled: true, preset: "enhanced", active: true, reason: null }

// Cambiar preset en vivo
__audioEnhancer.setPreset('original'); // sin procesamiento
__audioEnhancer.setPreset('enhanced'); // Hi-Fi (default)
__audioEnhancer.setPreset('flat');
__audioEnhancer.setPreset('vocal');
__audioEnhancer.setPreset('bass');
__audioEnhancer.setPreset('soft');

// Apagar / encender (bypass sin corte)
__audioEnhancer.setEnabled(false);
__audioEnhancer.setEnabled(true);
```

### Compatibilidad

- Web Audio API requiere un gesto del usuario para arrancar el `AudioContext` en algunos navegadores. El enhancer se cablea en respuesta al primer click de play (cumple autoplay policy).
- **Dos modos de cableado** (automático, según lo que dispare primero):
  - **Modo VU**: si el template usa el VU meter compartido (`assets/js/vu-meter.js`) y este crea su `AudioContext` + `MediaElementSource`, el enhancer re-usa ese grafo e inserta su cadena entre el `source` y el `analyser`.
  - **Modo standalone**: si el template NO usa el VU meter compartido (caso `app`, que tiene su propio VU meter local), el enhancer crea su propio `AudioContext` + `MediaElementSource` en el primer `play` y se cablea solo.
- **Control de volumen**: cuando el enhancer toma el control del audio (modo standalone, o en modo VU si CORS está OK), el `GainNode` del `<audio>` queda fuera de la ruta de señal. El enhancer agrega un `userGain` interno que se sincroniza con `audioElement.volume` mediante el evento `volumechange`, así el slider de volumen del reproductor sigue funcionando.
- Probado: Chrome/Edge/Firefox desktop y Android, Safari iOS (con `crossorigin` configurado).
- Si el navegador no soporta Web Audio API, el enhancer queda inactivo y el audio pasa intacto.

---

## Notas Importantes

1. **No duplicar métodos**: Los métodos de setup ya están en `TemplateBase`. Solo sobrescribir si hay lógica diferente.

2. **Construir URLs de imágenes**: Siempre usar `dataManager.getImageUrl(path)` para todas las imágenes (noticias, programas, sponsors, galerías, locutores, eventos, podcasts, videocasts).

3. **IDs de contenedor correctos**: Verificar que los IDs en el HTML coincidan con los configurados en `customDomIds`.

4. **Inicialización asíncrona**: Siempre usar `await super.init()` al principio del método `init()`.

5. **Limpieza al salir**: Siempre agregar el event listener `beforeunload` para destruir la instancia.

6. **Ocultar secciones vacías**: Cada sección debe ocultar su vista y su item del menú si el endpoint devuelve datos vacíos. Usar `toggleSectionVisibility(sectionName, hasData)`. Las secciones de carga bajo demanda deben precargarse en `loadAllContent()` con `preloadSection()` para ocultar el menú desde el inicio, no solo después del primer clic.

7. **Manejo de errores silencioso**: Los errores de carga de contenido no deben romper la página. Capturar cada carga por separado y mostrar fallbacks.

8. **Paginación**: Para noticias, podcasts y videocasts, implementar botón "Cargar más" o scroll infinito usando `currentPage` y verificando `pagination.hasMore`.

9. **Modal de noticia**: Al hacer clic en una noticia (hero, breaking, featured, grid), llamar a `loadNewsDetail(slug)` que abre el modal con el contenido completo.

10. **Cache de API**: La API tiene caché en memoria con TTL configurable. Usar `clearAPICache()` si se necesita forzar recarga.

---

## Formulario de Contacto

El sistema incluye un endpoint `/api/contact` en el servidor Node que envía los mensajes del formulario al email configurado de cada cliente usando **Resend** como servicio de envío.

### Arquitectura

```
[Formulario JS]  →  POST /api/contact  →  [Server.js]  →  [Resend API]  →  [Email del cliente]
```

**Multi-tenant**: la API key de Resend es única a nivel de plataforma (configurada por el administrador), pero el email de destino se lee del `config.json` de cada cliente. Esto permite que cada cliente reciba sus mensajes sin configuración adicional.

### Configuración inicial (una sola vez por plataforma)

1. **Crear cuenta en Resend**
   - Ir a https://resend.com
   - Crear cuenta (free tier: 3000 emails/mes, 100/día)
   - Ir a "API Keys" → "Create API Key"
   - Copiar la key (empieza con `re_`)

2. **Verificar dominio (recomendado para producción)**
   - En Resend → "Domains" → "Add Domain"
   - Agregar el dominio o subdominio (ej: `resend.ipstream.cl`)
   - Resend te da registros DNS para agregar (SPF, DKIM, verificación)
   - Esperar la verificación (puede tardar minutos a horas)
   - Una vez verificado, podés usar cualquier `email@ese-dominio` como remitente
   - Para testing rápido sin verificar dominio, podés usar `onboarding@resend.dev` por defecto, pero solo enviará al email con el que creaste la cuenta de Resend

3. **Configurar variables de entorno del servidor**

   **Opción A — Archivo `.env` (desarrollo local):**
   ```bash
   cp .env.example .env
   # Editar .env y completar RESEND_API_KEY, RESEND_FROM_EMAIL, etc.
   npm start
   ```
   El servidor carga automáticamente el `.env` al iniciar (gracias a `dotenv`).

   **Opción B — Variables de entorno del sistema (producción):**
   ```bash
   export RESEND_API_KEY="re_TU_API_KEY_AQUI"
   export RESEND_FROM_EMAIL="noreply@resend.ipstream.cl"
   export RESEND_FROM_NAME="Radio Online"
   node server.js
   ```

   **Opción C — En Docker/contenedor:**
   ```bash
   docker run -e RESEND_API_KEY=re_xxx \
              -e RESEND_FROM_EMAIL=noreply@resend.ipstream.cl \
              -e RESEND_FROM_NAME="Radio Online" \
              -p 3000:3000 mi-app
   ```

   **Opción D — Easypanel / panel del hosting:**
   Configurar las variables en la sección de "Environment Variables" del servicio.

   > El archivo `.env` ya está en `.gitignore`, así que es seguro para desarrollo. En producción, usar variables del sistema.

### Configuración por cliente

**Cada cliente solo necesita tener `contact_email` en su `config.json`**. Nada más.

```json
{
  "clientId": "cmf4...",
  "contact_email": "contacto@mi-radio.cl",
  ...
}
```

El servidor lee este campo automáticamente y envía los mensajes del formulario a esa dirección. **No hay que tocar nada más por cliente**.

### Implementación en el template

En el HTML, el formulario debe tener estos IDs:

```html
<form class="contact-form" id="contact-form">
  <input type="text" id="contact-name" required>
  <input type="email" id="contact-email" required>
  <input type="text" id="contact-subject" required>
  <textarea id="contact-message" required></textarea>
  <button type="submit" class="contact-submit-btn">Enviar</button>
  <div class="contact-feedback" id="contact-feedback" style="display:none;"></div>
</form>
```

En el JS, el handler de submit debe:

```js
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = form.querySelector('.contact-submit-btn');
  const feedback = document.getElementById('contact-feedback');
  const name = document.getElementById('contact-name').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const subject = document.getElementById('contact-subject').value.trim();
  const message = document.getElementById('contact-message').value.trim();

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

  try {
    const resp = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message })
    });
    const data = await resp.json().catch(() => ({}));

    if (resp.ok && data.success) {
      feedback.className = 'contact-feedback success';
      feedback.textContent = data.message || 'Gracias por tu mensaje.';
      feedback.style.display = 'block';
      form.reset();
    } else {
      throw new Error(data.message || 'Error al enviar');
    }
  } catch (err) {
    feedback.className = 'contact-feedback error';
    feedback.textContent = err.message || 'Error al enviar el mensaje.';
    feedback.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i><span>Enviar</span>';
  }
});
```

### Características de seguridad incluidas

- **Rate limiting**: 5 envíos por hora por IP (configurable en `server.js`)
- **Validación de campos**: todos obligatorios, email con regex
- **Límite de longitud**: nombre 100, asunto 200, mensaje 5000 caracteres
- **Sanitización**: se eliminan saltos de línea en headers para evitar inyección
- **CORS restringido**: solo POST y OPTIONS en `/api/contact`
- **Body limit**: 10KB máximo por request

### Respuesta del endpoint

**Éxito (200):**
```json
{ "success": true, "message": "Mensaje enviado correctamente." }
```

**Error de validación (400):**
```json
{ "success": false, "message": "Todos los campos son obligatorios." }
```

**Rate limit excedido (429):**
```json
{ "success": false, "message": "Demasiados intentos. Intenta de nuevo en una hora." }
```

**Error de Resend (500):**
```json
{ "success": false, "message": "No se pudo enviar el mensaje. Intenta más tarde." }
```

### Variables de entorno de Resend

| Variable | Obligatoria | Default | Descripción |
|----------|-------------|---------|-------------|
| `RESEND_API_KEY` | Sí | — | API key de Resend |
| `RESEND_FROM_EMAIL` | No | `onboarding@resend.dev` | Email remitente (debe ser de un dominio verificado en Resend) |
| `RESEND_FROM_NAME` | No | `Formulario Web` | Nombre que aparece como remitente |

Ejemplo de `.env` para producción con dominio verificado:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@resend.ipstream.cl
RESEND_FROM_NAME=Radio Online
```

### Troubleshooting

**El servidor devuelve "El servicio de contacto no está configurado"**
- Falta `RESEND_API_KEY` en las variables de entorno del servidor

**Los correos llegan a spam**
- Verificar dominio en Resend y configurar SPF/DKIM/DMARC en los DNS

**Responde con error 500 pero los logs no muestran nada**
- Revisar la consola del servidor Node, los errores de Resend se loguean ahí

**El rate limit es muy estricto / muy permisivo**
- Ajustar `max` y `windowMs` en `contactLimiter` dentro de `server.js`
