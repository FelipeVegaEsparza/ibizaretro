import TemplateBase from '/assets/js/template-base.js';
import { getDataManager } from '/assets/js/data-manager.js';
import VuMeter from '/assets/js/vu-meter.js';

class CoveredTemplate extends TemplateBase {
  constructor() {
    super({
      audioElementId: 'radio-audio',
      playButtonId: 'main-play-btn',
      volumeSliderId: 'volume-slider',
      defaultVolume: 50,
      socialContainerIds: ['social-links', 'footer-social'],
      customDomIds: {
        radioLogo: 'news-logo',
        footerRadioName: 'footer-title',
        trackTitle: 'track-title-main',
        trackArtist: 'track-artist-main',
        listenersCount: 'listeners-count',
        bitrate: 'bitrate',
        audioQuality: 'audio-quality',
        trackArtwork: 'track-artwork',
        defaultArtwork: 'default-artwork',
        currentDate: 'current-date',
        sponsorsCarousel: 'sponsors-carousel',
        sponsorsGrid: 'sponsors-grid',
      }
    });

    this.heroSwiper = null;
    this.sponsorsSwiper = null;
    this.currentPage = { news: 1, podcasts: 1, videocasts: 1 };
    this._newsTotalPages = 1;
    this._newsPerPage = 3;
    this.videoStreamUrl = null;
    this._tvPlayer = null;
    this._tvMode = null; // 'radio', 'tv', 'both'
    this._radioCoverUrl = null; // URL del cover de la radio (fallback)
    this.vuMeter = null; // visualizador de audio en el hero
  }

  async init() {
    console.log('CoveredTemplate: init started');
    await super.init();
    console.log('CoveredTemplate: super.init completed');
    try {
      await this.checkTVAvailability();
      await this.loadAllContent();
      this._populateAboutRadio();
      this.setupContactForm();
      this.setupCarousels();
      this.setupModalHandlers();
      this.setupTabs();
      this.setupAnimations();
      // Inicializa el VU meter (visualizador de audio en el hero).
      // Lo iniciamos en modo idle para que se vea desde el primer
      // render, sin esperar a que el usuario haga play.
      this.vuMeter = new VuMeter();
      this.vuMeter.init();
      this.vuMeter.stop();
      console.log('CoveredTemplate: Template fully initialized!');
    } catch (error) {
      console.error('CoveredTemplate: Error in init:', error);
    }
  }

  onBasicDataLoaded(data) {
    if (this._radioCoverUrl) {
      const coverImg = document.getElementById('cover-artwork');
      const coverDefault = document.getElementById('cover-card-default');
      const heroBg = document.getElementById('hero-player-bg');
      if (coverImg) {
        coverImg.src = this._radioCoverUrl;
        coverImg.style.display = 'block';
        if (coverDefault) coverDefault.style.display = 'none';
      }
      if (heroBg) {
        heroBg.style.backgroundImage = 'url(' + this._radioCoverUrl + ')';
        heroBg.classList.add('loaded');
      }
    }
  }

  async checkTVAvailability() {
    try {
      const dm = getDataManager();
      this.videoStreamUrl = await dm.loadVideoStreamUrl();

      let hasRadio = false;
      try {
        const basicData = await dm.loadBasicData();
        if (basicData) {
          hasRadio = !!(basicData.radioStreamingUrl || basicData.radioStreamUrl);
        }
      } catch (e) {
        hasRadio = false;
      }
      const hasTV = !!this.videoStreamUrl;

      if (hasTV && hasRadio) this._tvMode = 'both';
      else if (hasTV) this._tvMode = 'tv';
      else this._tvMode = 'radio';

      if (hasTV) {
        const playBtn = document.getElementById('main-play-btn');
        if (playBtn) playBtn.style.display = 'none';
        this._setupTVPlayer();
        if (this._tvMode === 'both') {
          this._setupMiniPlayer();
        }
      }
    } catch (error) {
      console.warn('CoveredTemplate: TV check failed:', error);
      this._tvMode = 'radio';
    }
  }

  _setupTVPlayer() {
    const heroEl = document.getElementById('hero-player');
    const innerEl = heroEl?.querySelector('.hero-player-inner');
    const bgEl = document.getElementById('hero-player-bg');
    const overlayEl = heroEl?.querySelector('.hero-player-overlay');
    const coverEl = document.getElementById('hero-player-cover');
    const infoEl = heroEl?.querySelector('.hero-player-info');

    if (!heroEl) return;

    if (innerEl) innerEl.style.display = 'none';
    if (bgEl) bgEl.style.opacity = '0';
    if (overlayEl) overlayEl.style.background = 'rgba(0,0,0,0.6)';

    const existing = heroEl.querySelector('.tv-player-container');
    if (existing) existing.remove();

    const tvContainer = document.createElement('div');
    tvContainer.className = 'tv-player-container';
    tvContainer.innerHTML = `
      <div class="tv-player-inner" id="tv-player-inner">
        <div class="tv-loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Cargando señal de TV...</span>
        </div>
      </div>
    `;
    heroEl.appendChild(tvContainer);

    if (window.VideoPlayer) {
      const player = new window.VideoPlayer('tv-player-inner', {
        autoplay: true,
        controls: false,
        muted: false
      });
      this._tvPlayer = player;
      // Wait for video element to be created, then load stream
      const waitForVideo = setInterval(() => {
        if (player.videoElement) {
          clearInterval(waitForVideo);
          player.loadStream(this.videoStreamUrl);
        }
      }, 100);
    }
  }

  _setupMiniPlayer() {
    const existing = document.querySelector('.fixed-mini-player');
    if (existing) return;

    const mini = document.createElement('div');
    mini.className = 'fixed-mini-player glass';
    mini.innerHTML = `
      <div class="mini-player-artwork">
        <img id="mini-track-artwork" src="" alt="" style="display:none;">
        <div class="mini-default-artwork" id="mini-default-artwork">
          <i class="fas fa-music"></i>
        </div>
      </div>
      <div class="mini-player-info">
        <div class="mini-track-title" id="mini-track-title">Radio</div>
        <div class="mini-track-artist" id="mini-track-artist">En Vivo</div>
      </div>
      <div class="mini-player-controls">
        <button class="mini-play-btn" id="mini-play-btn">
          <i class="fas fa-play"></i>
        </button>
        <div class="mini-volume">
          <i class="fas fa-volume-up"></i>
          <input type="range" id="mini-volume-slider" min="0" max="100" value="50">
        </div>
      </div>
    `;
    document.body.appendChild(mini);
    document.body.style.paddingBottom = '80px';

    const audio = document.getElementById('radio-audio');
    const miniPlay = document.getElementById('mini-play-btn');

    if (audio) {
      audio.addEventListener('play', () => {
        if (miniPlay) miniPlay.innerHTML = '<i class="fas fa-pause"></i>';
      });
      audio.addEventListener('pause', () => {
        if (miniPlay) miniPlay.innerHTML = '<i class="fas fa-play"></i>';
      });
    }

    if (miniPlay && audio) {
      miniPlay.addEventListener('click', () => {
        if (this.audioPlayer) {
          this.audioPlayer.toggle();
        } else if (audio.paused) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
      });
    }

    const miniVol = document.getElementById('mini-volume-slider');
    const mainVol = document.getElementById('volume-slider');
    if (miniVol && mainVol) {
      miniVol.addEventListener('input', (e) => {
        mainVol.value = e.target.value;
        mainVol.dispatchEvent(new Event('input'));
      });
    }
  }

  async loadAllContent() {
    const critical = [
      this.loadProgramsByDay()
    ];
    const secondary = [
      this.loadAllNews(),
      this.loadVideosRanking(),
    ];
    const tertiary = [
      this.loadPodcastsList(),
      this.loadVideocastsList(),
      this.loadSponsorsGrid(),
      this.loadGalleriesList(),
      this.loadAnnouncersGrid(),
      this.loadPolls(),
      this.loadEventsTimeline()
    ];
    await Promise.allSettled(critical);
    await Promise.allSettled(secondary);
    await Promise.allSettled(tertiary);
  }

  async loadAllNews(page) {
    const dm = getDataManager();
    const pg = page || 1;
    const result = await dm.loadNews(pg, this._newsPerPage);
    if (!result.data || !result.data.length) {
      this._toggleSection('all-news-grid', false);
      return;
    }
    this._toggleSection('all-news-grid', true);
    for (const item of result.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    const container = document.getElementById('all-news-grid');
    if (!container) return;
    container.innerHTML = result.data.map(item => `
      <article class="news-card" data-slug="${item.slug}">
        <img src="${item.imageUrl || '/assets/images/default-news.jpg'}" alt="${item.name}" loading="lazy">
        <div class="news-body">
          <h3>${item.name}</h3>
          <p>${item.shortText || ''}</p>
          <small>${new Date(item.createdAt).toLocaleDateString('es-ES')}</small>
        </div>
      </article>
    `).join('');
    this._newsTotalPages = result.pagination?.totalPages || 1;
    this._renderNewsPagination(pg);
  }

  _renderNewsPagination(currentPage) {
    const container = document.getElementById('news-pagination');
    if (!container) return;
    if (this._newsTotalPages <= 1) {
      container.innerHTML = '';
      return;
    }
    let html = '';
    for (let i = 1; i <= this._newsTotalPages; i++) {
      html += '<button class="page-btn' + (i === currentPage ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    container.innerHTML = html;
    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.page);
        this.loadAllNews(p);
        document.getElementById('all-news-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
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
      ${news.imageUrl ? '<img src="' + news.imageUrl + '" alt="' + news.name + '" class="news-detail-img">' : ''}
      <div class="news-content">${news.longText || news.description || news.shortText || ''}</div>
      ${news.createdAt ? '<small>' + new Date(news.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) + '</small>' : ''}
      ${news.author ? '<small style="margin-left:12px;">— ' + news.author + '</small>' : ''}
    `;
    this.openModal('news-modal');
  }

  // ---- PROGRAMACIÓN ----

  async loadProgramsByDay() {
    const dm = getDataManager();
    const programs = await dm.loadPrograms();
    if (!programs || !programs.length) {
      this._toggleSection('day-nav', false);
      return;
    }
    this._toggleSection('day-nav', true);
    for (const p of programs) {
      if (p.imageUrl) p.imageUrl = await dm.getImageUrl(p.imageUrl);
    }
    this._programs = programs;
    const dayMap = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
      thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' };
    this._programDayMap = {};
    for (const p of programs) {
      const days = p.weekDays || [];
      for (const d of days) {
        const esDay = dayMap[d.toLowerCase()] || d;
        if (!this._programDayMap[esDay]) this._programDayMap[esDay] = [];
        this._programDayMap[esDay].push(p);
      }
    }
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
    const firstDay = Object.keys(this._programDayMap).find(d => d.toLowerCase() === today.toLowerCase()) || 'Lunes';
    this._selectedDay = firstDay;
    this._renderDayPrograms(firstDay);
    this._setupDayNav();
  }

  _setupDayNav() {
    const nav = document.getElementById('day-nav');
    if (!nav) return;
    nav.querySelectorAll('.day-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dayName = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
          jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' }[btn.dataset.day];
        if (!dayName || dayName === this._selectedDay) return;
        nav.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._selectedDay = dayName;
        this._renderDayPrograms(dayName);
      });
    });
    const dayKeys = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
      jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };
    const activeKey = Object.keys(dayKeys).find(k => dayKeys[k] === this._selectedDay);
    const activeBtn = nav.querySelector('[data-day="' + activeKey + '"]');
    if (activeBtn) activeBtn.classList.add('active');
  }

  _renderDayPrograms(dayName) {
    const container = document.getElementById('programs-list');
    if (!container) return;
    const dayPrograms = (this._programDayMap[dayName] || []).sort((a, b) =>
      (a.startTime || '').localeCompare(b.startTime || ''));
    if (!dayPrograms.length) {
      container.innerHTML = '<p style="text-align:center;color:#9e9ea0;padding:40px 0;">No hay programación para este día</p>';
      return;
    }
    container.innerHTML = dayPrograms.map(p => `
      <div class="program-card">
        ${p.imageUrl ? '<div class="program-card-img"><img src="' + p.imageUrl + '" alt="' + p.name + '" loading="lazy"></div>' : ''}
        <div class="program-card-body">
          <div class="program-card-time">${p.startTime || ''}${p.endTime ? ' - ' + p.endTime : ''}</div>
          <div class="program-card-name">${p.name}</div>
          ${p.description ? '<div class="program-card-desc">' + p.description + '</div>' : ''}
          ${p.host ? '<div class="program-card-host"><i class="fas fa-user"></i> ' + p.host + '</div>' : ''}
        </div>
      </div>
    `).join('');
  }

  // ---- PODCASTS ----

  async loadPodcastsList() {
    const dm = getDataManager();
    const result = await dm.loadPodcasts(1, 10);
    if (!result.data || !result.data.length) {
      this._toggleSection('podcasts-list', false);
      return;
    }
    this._toggleSection('podcasts-list', true);
    for (const item of result.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    const container = document.getElementById('podcasts-list');
    if (!container) return;
    container.innerHTML = result.data.map(p => `
      <div class="podcast-card" data-id="${p.id}">
        <div class="card-thumb">
          <img src="${p.imageUrl || '/assets/icons/icon-96x96.png'}" alt="${p.title}" loading="lazy">
          <div class="card-overlay"><i class="fas fa-play"></i></div>
          ${p.duration ? '<span class="card-badge">' + p.duration + '</span>' : ''}
        </div>
        <div class="card-body">
          <h3>${p.title}</h3>
          ${p.shortText ? '<p>' + p.shortText + '</p>' : ''}
          ${p.createdAt ? '<small>' + new Date(p.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + '</small>' : ''}
        </div>
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
      const audioUrl = podcast.audioUrl || podcast.fileUrl || podcast.url || podcast.audio || '';
      if (audioUrl) {
        audio.src = audioUrl.startsWith('http') ? audioUrl : await dm.getImageUrl(audioUrl);
        audio.load();
        audio.addEventListener('canplaythrough', () => { audio.play().catch(() => {}); }, { once: true });
      }
    }
    this.openModal('podcast-modal');
  }

  // ---- VIDECASTS ----

  async loadVideocastsList() {
    const dm = getDataManager();
    const result = await dm.loadVideocasts(1, 10);
    if (!result.data || !result.data.length) {
      this._toggleSection('videocasts-list', false);
      return;
    }
    this._toggleSection('videocasts-list', true);
    for (const item of result.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    const container = document.getElementById('videocasts-list');
    if (!container) return;
    container.innerHTML = result.data.map(v => `
      <div class="videocast-card" data-id="${v.id}">
        <div class="card-thumb">
          <img src="${v.imageUrl || '/assets/icons/icon-96x96.png'}" alt="${v.title}" loading="lazy">
          <div class="card-overlay"><i class="fas fa-play"></i></div>
          ${v.duration ? '<span class="card-badge">' + v.duration + '</span>' : ''}
        </div>
        <div class="card-body">
          <h3>${v.title}</h3>
        </div>
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

  // ---- VIDEOS (RANKING) ----

  async loadVideosRanking() {
    const dm = getDataManager();
    const result = await dm.loadVideos();
    const container = document.getElementById('videos-ranking');
    if (!container) return;
    const videos = result.data || result || [];
    if (!videos.length) {
      this._toggleSection('videos-ranking', false);
      return;
    }
    this._toggleSection('videos-ranking', true);
    container.innerHTML = videos.sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(v => {
        const videoId = this.extractYouTubeId(v.videoUrl);
        const thumbUrl = videoId ? 'https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg' : '';
        return `
        <div class="video-ranking-item" data-url="${v.videoUrl}">
          ${thumbUrl ? '<div class="video-rank-thumb"><img src="' + thumbUrl + '" alt="' + v.name + '" loading="lazy"></div>' : '<div class="video-rank-thumb video-rank-thumb-placeholder"><i class="fas fa-play"></i></div>'}
          <span class="rank-num">${v.order || ''}</span>
          <div class="rank-info">
            <strong>${v.name}</strong>
            <p>${v.description || ''}</p>
          </div>
        </div>
      `;
      }).join('');
  }

  // ---- SPONSORS ----

  async loadSponsorsCarousel() {
    const dm = getDataManager();
    const sponsors = await dm.loadSponsors();
    if (!sponsors || !sponsors.length) {
      this._toggleSection('sponsors-carousel', false);
      return;
    }
    this._toggleSection('sponsors-carousel', true);
    for (const s of sponsors) {
      if (s.logoUrl) s.logoUrl = await dm.getImageUrl(s.logoUrl);
    }
    const container = document.getElementById('sponsors-carousel');
    if (!container) return;
    container.innerHTML = sponsors.map(s => `
      <div class="swiper-slide">
        <a href="${s.website || '#'}" target="_blank" rel="noopener">
          <img src="${s.logoUrl}" alt="${s.name}" title="${s.name}" style="max-height:60px;width:auto;">
        </a>
      </div>
    `).join('');
  }

  async loadSponsorsGrid() {
    const dm = getDataManager();
    const sponsors = await dm.loadSponsors();
    if (!sponsors || !sponsors.length) {
      this._toggleSection('sponsors-grid', false);
      return;
    }
    this._toggleSection('sponsors-grid', true);
    const container = document.getElementById('sponsors-grid');
    if (!container) return;
    for (const s of sponsors) {
      if (s.logoUrl) s.logoUrl = await dm.getImageUrl(s.logoUrl);
    }
    const socialIconMap = {
      facebook: 'fab fa-facebook-f', youtube: 'fab fa-youtube', instagram: 'fab fa-instagram',
      tiktok: 'fab fa-tiktok', whatsapp: 'fab fa-whatsapp', x: 'fab fa-x-twitter'
    };
    container.innerHTML = sponsors.map(s => {
      const socialLinks = Object.entries(socialIconMap)
        .filter(([key]) => s[key])
        .map(([key, icon]) => '<a href="' + s[key] + '" target="_blank" rel="noopener" class="sponsor-social-link"><i class="' + icon + '"></i></a>')
        .join('');
      return `
      <div class="sponsor-card">
        <div class="sponsor-card-header">
          <img src="${s.logoUrl || '/assets/icons/icon-96x96.png'}" alt="${s.name}">
          <h3>${s.name}</h3>
        </div>
        ${s.description ? '<div class="sponsor-card-body"><p>' + s.description + '</p></div>' : ''}
        ${s.address ? '<div class="sponsor-address"><i class="fas fa-map-marker-alt"></i> ' + s.address + '</div>' : ''}
        ${s.website ? '<a href="' + s.website + '" target="_blank" rel="noopener" class="sponsor-website"><i class="fas fa-globe"></i> ' + s.website + '</a>' : ''}
        ${socialLinks ? '<div class="sponsor-social-links">' + socialLinks + '</div>' : ''}
      </div>
    `;}).join('');
  }

  // ---- GALERÍAS ----

  async loadGalleriesList() {
    const dm = getDataManager();
    const galleries = await dm.loadGalleries();
    if (!galleries || !galleries.length) {
      this._toggleSection('galleries-list', false);
      return;
    }
    this._toggleSection('galleries-list', true);
    const container = document.getElementById('galleries-list');
    if (!container) return;
    for (const g of galleries) {
      const cover = (g.images && g.images.length) ? g.images[0].imageUrl : null;
      g._coverUrl = cover ? await dm.getImageUrl(cover) : null;
    }
    container.innerHTML = galleries.map(g => `
      <div class="gallery-card" data-id="${g.id}">
        <div class="gallery-card-img">
          <img src="${g._coverUrl || '/assets/icons/icon-96x96.png'}" alt="${g.title || g.name || ''}" loading="lazy">
          <div class="gallery-card-overlay">
            <span><i class="fas fa-images"></i> ${(g.images || []).length} fotos</span>
          </div>
        </div>
        <div class="gallery-card-body">
          <h3>${g.title || g.name || ''}</h3>
          ${g.description ? '<p>' + g.description + '</p>' : ''}
          ${g.createdAt ? '<small>' + new Date(g.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) + '</small>' : ''}
        </div>
      </div>
    `).join('');
  }

  async openGallery(id) {
    try {
      const dm = getDataManager();
      const galleries = await dm.loadGalleries();
      const gallery = (galleries || []).find(g => g.id === id);
      if (!gallery) {
        console.warn('CoveredTemplate: Gallery not found:', id);
        return;
      }
      const body = document.getElementById('gallery-modal-body');
      const thumbs = document.getElementById('gallery-thumbnails');
      if (body && gallery.images && gallery.images.length) {
        const firstImg = await dm.getImageUrl(gallery.images[0].imageUrl);
        body.innerHTML = `<img src="${firstImg}" class="gallery-main-img">`;
      } else if (body) {
        body.innerHTML = '<p style="text-align:center;color:#9e9ea0;padding:40px;">Sin imágenes disponibles</p>';
      }
      if (thumbs && gallery.images) {
        const sorted = [...gallery.images].sort((a, b) => (a.order || 0) - (b.order || 0));
        let html = '';
        for (const img of sorted) {
          const url = await dm.getImageUrl(img.imageUrl);
          html += `<img src="${url}" class="gallery-thumb" data-url="${url}">`;
        }
        thumbs.innerHTML = html;
      }
      this.openModal('gallery-modal');
    } catch (error) {
      console.error('CoveredTemplate: Error opening gallery:', error);
    }
  }

  // ---- LOCUTORES ----

  async loadAnnouncersGrid() {
    const dm = getDataManager();
    const announcers = await dm.loadAnnouncers();
    if (!announcers || !announcers.length) {
      this._toggleSection('announcers-grid', false);
      return;
    }
    this._toggleSection('announcers-grid', true);
    const container = document.getElementById('announcers-grid');
    if (!container) return;
    for (const a of announcers) {
      const img = a.imageUrl || a.photoUrl;
      if (img) a._photoUrl = await dm.getImageUrl(img);
    }
    container.innerHTML = announcers.map(a => {
      const bio = a.biography || a.description || a.bio || a.about || '';
      return `
      <div class="announcer-card">
        <div class="announcer-photo">
          <img src="${a._photoUrl || '/assets/icons/icon-96x96.png'}" alt="${a.name || ''}" loading="lazy">
        </div>
        <h3>${a.name || ''}</h3>
        ${bio ? '<p>' + bio + '</p>' : ''}
        ${a.createdAt ? '<span class="announcer-date">Desde ' + new Date(a.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) + '</span>' : ''}
      </div>
    `;
    }).join('');
  }

  // ---- ENCUESTAS ----

  async loadPolls() {
    const dm = getDataManager();
    const polls = await dm.loadPolls();
    if (!polls || !polls.length) {
      this._toggleSection('polls-grid', false);
      return;
    }
    this._toggleSection('polls-grid', true);
    const container = document.getElementById('polls-grid');
    if (!container) return;
    container.innerHTML = polls.filter(p => p.active).map(poll => `
      <div class="poll-card-modern" data-id="${poll.id}">
        <div class="poll-card-header">
          <div class="poll-icon"><i class="fas fa-chart-bar"></i></div>
          <h3 class="poll-question-modern">${poll.question || poll.title || poll.name || poll.text || ''}</h3>
        </div>
        <div class="poll-options-modern">
          ${(poll.options || []).map(opt => `
            <button class="poll-option-modern" data-poll-id="${poll.id}" data-option-id="${opt.id}">
              <span class="poll-option-label">${opt.text}</span>
              <span class="poll-bar-modern" style="width:0%"></span>
              <span class="poll-count-modern">${opt.votes || 0}</span>
            </button>
          `).join('')}
        </div>
        <p class="poll-voted-msg" style="display:none;">
          <i class="fas fa-check-circle"></i> ¡Gracias por votar!
        </p>
      </div>
    `).join('');
  }

  async handleVote(pollId, optionId) {
    const dm = getDataManager();
    try {
      await dm.votePoll(pollId, optionId);
      const polls = await dm.loadPolls();
      const poll = (polls || []).find(p => p.id === pollId);
      if (!poll) return;
      const total = (poll.options || []).reduce((sum, o) => sum + (o.votes || 0), 0);
      const card = document.querySelector(`.poll-card-modern[data-id="${pollId}"]`);
      if (!card) return;
      const options = card.querySelectorAll('.poll-option-modern');
      options.forEach((btn, i) => {
        const opt = (poll.options || [])[i];
        if (!opt) return;
        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
        btn.querySelector('.poll-bar-modern').style.width = pct + '%';
        btn.querySelector('.poll-count-modern').textContent = opt.votes + ' (' + pct + '%)';
        btn.disabled = true;
      });
      const msg = card.querySelector('.poll-voted-msg');
      if (msg) msg.style.display = 'flex';
    } catch (error) {
      console.error('CoveredTemplate: Error voting:', error);
      alert('Error al registrar tu voto. Intenta de nuevo.');
    }
  }

  // ---- EVENTOS ----

  async loadEventsTimeline() {
    const dm = getDataManager();
    const events = await dm.loadEvents();
    if (!events || !events.length) {
      this._toggleSection('events-timeline', false);
      return;
    }
    this._toggleSection('events-timeline', true);
    const container = document.getElementById('events-timeline');
    if (!container) return;
    const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    for (const e of sorted) {
      if (e.imageUrl) e.imageUrl = await dm.getImageUrl(e.imageUrl);
    }
    container.innerHTML = sorted.map(e => `
      <div class="event-item">
        <div class="event-img">
          ${e.imageUrl ? '<img src="' + e.imageUrl + '" alt="' + (e.title || e.name || '') + '" loading="lazy">' : ''}
          <div class="event-date-badge">
            <span class="event-day">${new Date(e.date).getDate()}</span>
            <span class="event-month">${new Date(e.date).toLocaleDateString('es-ES', { month: 'short' })}</span>
          </div>
        </div>
        <div class="event-info">
          <h3>${e.title || e.name || ''}</h3>
          <p>${e.description || ''}</p>
          <div class="event-meta">
            ${e.time ? '<span><i class="fas fa-clock"></i> ' + e.time + '</span>' : ''}
            ${e.location ? '<span><i class="fas fa-map-marker-alt"></i> ' + e.location + '</span>' : ''}
            ${e.eventUrl ? '<a href="' + e.eventUrl + '" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> Más info</a>' : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  // ---- CAROUSELS ----

  setupCarousels() {
    if (typeof Swiper === 'undefined') return;
    setTimeout(() => {
      const heroSlides = document.querySelectorAll('#hero-carousel .swiper-slide');
      if (document.querySelector('.hero-swiper') && heroSlides.length > 0 && !this.heroSwiper) {
        try {
          this.heroSwiper = new Swiper('.hero-swiper', {
            loop: heroSlides.length > 1,
            autoplay: { delay: 5000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
          });
        } catch (e) { console.warn('Hero Swiper error:', e.message); }
      }
      const sponsorSlides = document.querySelectorAll('#sponsors-carousel .swiper-slide');
      if (document.querySelector('.sponsors-swiper') && sponsorSlides.length > 0 && !this.sponsorsSwiper) {
        try {
          this.sponsorsSwiper = new Swiper('.sponsors-swiper', {
            loop: sponsorSlides.length > 1,
            autoplay: { delay: 3000, disableOnInteraction: false },
            slidesPerView: 'auto',
            spaceBetween: 20,
            pagination: { el: '.swiper-pagination', clickable: true }
          });
        } catch (e) { console.warn('Sponsors Swiper error:', e.message); }
      }
    }, 1000);
  }

  // ---- MODAL HANDLERS ----

  setupModalHandlers() {
    document.querySelectorAll('.modal').forEach(modal => {
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal(modal.id));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal.id);
      });
    });

    document.addEventListener('click', (e) => {
      const shareBtn = e.target.closest('#share-btn');
      if (shareBtn) {
        e.preventDefault();
        if (navigator.share) {
          navigator.share({ url: window.location.href });
        } else {
          navigator.clipboard.writeText(window.location.href);
        }
        return;
      }

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
            body.innerHTML = '<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/' + videoId + '" frameborder="0" allowfullscreen></iframe></div>';
          }
          this.openModal('video-modal');
        }
        return;
      }

      const galleryCard = e.target.closest('.gallery-card');
      if (galleryCard) {
        this.openGallery(galleryCard.dataset.id);
        return;
      }

      const galleryThumb = e.target.closest('.gallery-thumb');
      if (galleryThumb) {
        const main = document.querySelector('.gallery-main-img');
        if (main) main.src = galleryThumb.dataset.url;
        return;
      }

      const pollOption = e.target.closest('.poll-option-modern');
      if (pollOption && !pollOption.disabled) {
        this.handleVote(pollOption.dataset.pollId, pollOption.dataset.optionId);
        return;
      }
    });
  }

  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
  }

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
    const audio = document.getElementById('podcast-audio');
    if (audio && !audio.paused) audio.pause();
  }

  onCurrentSongLoaded(songData) {
    const listenersEl = document.getElementById('sidebar-listeners');
    if (listenersEl) listenersEl.textContent = songData.listeners || '0';
    const songsEl = document.getElementById('sidebar-songs');
    if (songsEl && songData.history) songsEl.textContent = songData.history.length || '0';
    this._updateMiniPlayer(songData);
    if (this._tvMode === 'radio') {
      this.updateHeroPlayer(songData);
    }
  }

  _updateMiniPlayer(songData) {
    if (this._tvMode !== 'both') return;
    const miniTitle = document.getElementById('mini-track-title');
    const miniArtist = document.getElementById('mini-track-artist');
    const miniArtwork = document.getElementById('mini-track-artwork');
    const miniDefault = document.getElementById('mini-default-artwork');
    const playBtn = document.getElementById('mini-play-btn');
    const audio = document.getElementById('radio-audio');

    if (miniTitle) miniTitle.textContent = songData.title || 'Radio';
    if (miniArtist) miniArtist.textContent = songData.artist || 'En Vivo';

    if (songData.art && miniArtwork) {
      miniArtwork.src = songData.art;
      miniArtwork.style.display = 'block';
      if (miniDefault) miniDefault.style.display = 'none';
    } else if (miniArtwork) {
      miniArtwork.style.display = 'none';
      if (miniDefault) miniDefault.style.display = 'flex';
    }

    if (playBtn && audio) {
      playBtn.innerHTML = audio.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    }
  }

  _setHeroCover(url) {
    const coverImg = document.getElementById('cover-artwork');
    const coverDefault = document.getElementById('cover-card-default');
    const heroBg = document.getElementById('hero-player-bg');
    if (coverImg) {
      coverImg.src = url;
      coverImg.style.display = 'block';
      if (coverDefault) coverDefault.style.display = 'none';
    }
    if (heroBg) {
      heroBg.style.backgroundImage = 'url(' + url + ')';
      heroBg.classList.add('loaded');
    }
  }

  _showHeroDefault() {
    const coverImg = document.getElementById('cover-artwork');
    const coverDefault = document.getElementById('cover-card-default');
    const heroBg = document.getElementById('hero-player-bg');
    if (coverImg) coverImg.style.display = 'none';
    if (coverDefault) coverDefault.style.display = 'flex';
    if (heroBg) {
      heroBg.style.backgroundImage = '';
      heroBg.classList.remove('loaded');
    }
  }

  updateHeroPlayer(songData) {
    if (this._tvMode && this._tvMode !== 'radio') return;
    const titleEl = document.getElementById('track-title-main');
    const artistEl = document.getElementById('track-artist-main');
    const coverImg = document.getElementById('cover-artwork');

    const artUrl = songData.art || '';
    const title = songData.title || 'Radio';
    const artist = songData.artist || 'En Vivo';

    if (titleEl) titleEl.textContent = title;
    if (artistEl) artistEl.textContent = artist;

    if (artUrl && artUrl !== coverImg?.src) {
      const img = new Image();
      img.onload = () => this._setHeroCover(artUrl);
      img.onerror = () => {
        if (this._radioCoverUrl) {
          this._setHeroCover(this._radioCoverUrl);
        } else {
          this._showHeroDefault();
        }
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

  async _populateAboutRadio() {
    try {
      const { getBasicData } = await import('/assets/js/api.js');
      const data = await getBasicData();
      const img = document.getElementById('about-radio-img');
      const titleEl = document.getElementById('about-radio-title');
      const descEl = document.getElementById('about-radio-desc');
      const dm = getDataManager();

      if (img && data.coverUrl) {
        img.src = await dm.getImageUrl(data.coverUrl);
      } else if (img && data.logoUrl) {
        img.src = await dm.getImageUrl(data.logoUrl);
      }
      if (titleEl) titleEl.textContent = data.projectName || data.name || 'Nuestra Radio';
      if (descEl) descEl.textContent = data.projectDescription || data.description || 'Bienvenido a nuestra radio. Disfruta de la mejor música y contenido.';
    } catch (e) {
      console.warn('CoveredTemplate: Error loading about radio:', e);
    }
  }

  setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    this._populateContactCover();

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
          if (feedback) {
            feedback.className = 'contact-feedback success';
            feedback.textContent = data.message || 'Gracias por tu mensaje. Te responderemos pronto.';
            feedback.style.display = 'block';
          }
          form.reset();
        } else {
          throw new Error(data.message || 'Error al enviar el mensaje');
        }
      } catch (err) {
        if (feedback) {
          feedback.className = 'contact-feedback error';
          feedback.textContent = err.message || 'Error al enviar el mensaje. Intenta de nuevo.';
          feedback.style.display = 'block';
        }
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i><span>Enviar mensaje</span>';
      }
    });
  }

  async _populateContactCover() {
    try {
      const { getBasicData } = await import('/assets/js/api.js');
      const data = await getBasicData();
      const img = document.getElementById('contact-cover-img');
      const nameEl = document.getElementById('contact-radio-name');
      const descEl = document.getElementById('contact-radio-desc');
      const dm = getDataManager();

      if (img && data.coverUrl) {
        img.src = await dm.getImageUrl(data.coverUrl);
      } else if (img && data.logoUrl) {
        img.src = await dm.getImageUrl(data.logoUrl);
      }
      if (nameEl) nameEl.textContent = data.projectName || data.name || 'Nuestra Radio';
      if (descEl) descEl.textContent = data.projectDescription || data.description || 'Estamos aquí para escucharte.';
    } catch (e) {
      console.warn('CoveredTemplate: Error loading contact cover:', e);
    }
  }

  _showEmpty(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>' + message + '</p></div>';
  }

  _toggleSection(containerId, hasData) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const section = container.closest('.section') || container.closest('.full-section') || container.closest('[class*="section"]');
    if (section) section.style.display = hasData ? '' : 'none';
  }

  // ============================================================
  // AUDIO PLAYBACK HOOKS
  // El TemplateBase llama a estos métodos en play/pause del audio.
  // Los usamos para arrancar/detener el VU meter.
  // ============================================================
  onAudioPlay() {
    super.onAudioPlay();
    if (this.vuMeter) this.vuMeter.start();
  }

  onAudioPause() {
    super.onAudioPause();
    if (this.vuMeter) this.vuMeter.stop();
  }

  // ============================================================
  // CLEANUP
  // ============================================================
  destroy() {
    if (this.vuMeter) {
      this.vuMeter.destroy();
      this.vuMeter = null;
    }
    // (TV player cleanup lo maneja el TemplateBase si corresponde)
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.coveredTemplate = new CoveredTemplate();
    await window.coveredTemplate.init();
  } catch (error) {
    console.error('CoveredTemplate: Error creating instance:', error);
  }
});

window.addEventListener('beforeunload', () => {
  if (window.coveredTemplate) window.coveredTemplate.destroy();
});

export default CoveredTemplate;
