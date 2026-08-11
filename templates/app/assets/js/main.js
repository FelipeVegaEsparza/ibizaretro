import TemplateBase from '/assets/js/template-base.js';
import { getDataManager } from '/assets/js/data-manager.js';

class AppTemplate extends TemplateBase {
  constructor() {
    super({
      audioElementId: 'radio-audio',
      playButtonId: 'main-play-btn',
      volumeSliderId: 'volume-slider',
      defaultVolume: 50,
      socialContainerIds: ['social-links', 'about-social'],
      customDomIds: {
        radioLogo: 'news-logo',
        footerRadioName: 'footer-title',
        trackTitle: 'track-title-main',
        trackArtist: 'track-artist-main',
        listenersCount: 'listeners-count',
        bitrate: 'bitrate',
        trackArtwork: 'track-artwork',
        defaultArtwork: 'default-artwork',
        currentDate: 'current-date'
      }
    });

    this.heroSwiper = null;
    this.currentPage = { news: 1, podcasts: 1 };
    this._newsTotalPages = 1;
    this._newsPerPage = 4;
    this._programs = null;
    this._programDayMap = {};
    this._selectedDay = 'Lunes';
    this.videoStreamUrl = null;
    this._tvPlayer = null;
    this._tvMode = null;
  }

  async init() {
    console.log('AppTemplate: init started');
    await super.init();
    console.log('AppTemplate: super.init completed');
    try {
      this.setupBottomNav();
      await this.checkTVAvailability();
      await this.loadAllContent();
      // FIX: recalcular overflow después de que _toggleSection
      // haya ocultado/mostrado items según los datos cargados.
      requestAnimationFrame(() => this._updateNavOverflow());
      this.setupModalHandlers();
      this.setupContactForm();
      // Inicializa el VU meter en modo idle para que sea visible
      // desde el primer render, sin esperar a que el usuario
      // haga play.
      this._initVuMeter();
      this._stopVuMeter();
      console.log('AppTemplate: Template fully initialized!');
    } catch (error) {
      console.error('AppTemplate: Error in init:', error);
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
      } catch (e) { hasRadio = false; }
      const hasTV = !!this.videoStreamUrl;
      if (hasTV && hasRadio) this._tvMode = 'both';
      else if (hasTV) this._tvMode = 'tv';
      else this._tvMode = 'radio';
      this._toggleSection('tv-player-container', hasTV);
    } catch (error) {
      this._tvMode = 'radio';
      this._toggleSection('tv-player-container', false);
    }
  }

  async loadAllContent() {
    await Promise.allSettled([
      this.loadAllNews(),
      this.loadProgramsByDay(),
      this.loadPodcastsList(),
      this.loadVideocastsList(),
      this.loadVideosRanking(),
      this.loadGalleriesList(),
      this.loadAnnouncersList(),
      this.loadSponsorsGrid(),
      this.loadPolls(),
      this.loadEventsTimeline()
    ]);
    this._populateAbout();
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
        <img src="${item.imageUrl || '/assets/icons/icon-96x96.png'}" alt="${item.name}" loading="lazy">
        <div class="news-body">
          <h3>${item.name}</h3>
          <p>${item.shortText || ''}</p>
          <small>${new Date(item.createdAt).toLocaleDateString('es-ES')}</small>
        </div>
      </article>
    `).join('');
    this._newsTotalPages = result.pagination?.totalPages || 1;
    this._renderPagination(pg);
  }

  _renderPagination(current) {
    const container = document.getElementById('news-pagination');
    if (!container) return;
    if (this._newsTotalPages <= 1) { container.innerHTML = ''; return; }
    let html = '';
    for (let i = 1; i <= this._newsTotalPages; i++) {
      html += '<button class="page-btn' + (i === current ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    container.innerHTML = html;
    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => this.loadAllNews(parseInt(btn.dataset.page)));
    });
  }

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
    this._selectedDay = Object.keys(this._programDayMap).find(d => d.toLowerCase() === today.toLowerCase()) || 'Lunes';
    this._renderDayPrograms();
    this._setupDayNav();
  }

  _setupDayNav() {
    const nav = document.getElementById('day-nav');
    if (!nav) return;
    nav.querySelectorAll('.day-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dayNames = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
          jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };
        const dayName = dayNames[btn.dataset.day];
        if (!dayName || dayName === this._selectedDay) return;
        nav.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._selectedDay = dayName;
        this._renderDayPrograms();
      });
    });
    const dayKeys = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
      jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };
    const activeKey = Object.keys(dayKeys).find(k => dayKeys[k] === this._selectedDay);
    const activeBtn = nav.querySelector('[data-day="' + activeKey + '"]');
    if (activeBtn) activeBtn.classList.add('active');
  }

  _renderDayPrograms() {
    const container = document.getElementById('programs-list');
    if (!container) return;
    const dayPrograms = (this._programDayMap[this._selectedDay] || []).sort((a, b) =>
      (a.startTime || '').localeCompare(b.startTime || ''));
    if (!dayPrograms.length) {
      container.innerHTML = '<p style="text-align:center;color:rgba(255,255,255,0.3);padding:30px 0;">Sin programación</p>';
      return;
    }
    container.innerHTML = dayPrograms.map(p => `
      <div class="program-card">
        ${p.imageUrl ? '<div class="program-card-img"><img src="' + p.imageUrl + '" alt="' + p.name + '" loading="lazy"></div>' : ''}
        <div class="program-card-body">
          <div class="program-card-time">${p.startTime || ''}${p.endTime ? ' - ' + p.endTime : ''}</div>
          <div class="program-card-name">${p.name}</div>
          ${p.host ? '<div class="program-card-host"><i class="fas fa-user"></i> ' + p.host + '</div>' : ''}
        </div>
      </div>
    `).join('');
  }

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
        </div>
      </div>
    `).join('');
  }

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
    container.innerHTML = polls.filter(p => p.active).map(poll => {
      const question = poll.question || poll.title || poll.name || '';
      return `
      <div class="poll-card-modern" data-id="${poll.id}">
        <div class="poll-card-header">
          <div class="poll-icon"><i class="fas fa-chart-bar"></i></div>
          <h3 class="poll-question-modern">${question}</h3>
        </div>
        <div class="poll-options-modern">
          ${(poll.options || []).map(opt => `
            <button class="poll-option-modern" data-poll-id="${poll.id}" data-option-id="${opt.id}">
              <span class="poll-option-label">${opt.text || ''}</span>
              <span class="poll-bar-modern" style="width:0%"></span>
              <span class="poll-count-modern">${opt.votes || 0}</span>
            </button>
          `).join('')}
        </div>
        <p class="poll-voted-msg" style="display:none;"><i class="fas fa-check-circle"></i> Gracias por votar</p>
      </div>`;
    }).join('');
  }

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
      <div class="media-card" data-videocast-id="${v.id}">
        <div class="media-card-thumb">
          <img src="${v.imageUrl || '/assets/icons/icon-96x96.png'}" alt="${v.title}" loading="lazy">
          <div class="media-card-overlay"><i class="fas fa-play"></i></div>
          ${v.duration ? '<span class="media-card-badge">' + v.duration + '</span>' : ''}
        </div>
        <div class="media-card-body">
          <h4>${v.title}</h4>
        </div>
      </div>
    `).join('');
  }

  async loadVideosRanking() {
    const dm = getDataManager();
    const result = await dm.loadVideos();
    const videos = result.data || result || [];
    if (!videos.length) {
      this._toggleSection('videos-ranking', false);
      return;
    }
    this._toggleSection('videos-ranking', true);
    const container = document.getElementById('videos-ranking');
    if (!container) return;
    container.innerHTML = videos.sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(v => {
        const videoId = this._extractYouTubeId(v.videoUrl);
        const thumbUrl = videoId ? 'https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg' : '';
        return `
        <div class="video-rank-item" data-url="${v.videoUrl || ''}">
          ${thumbUrl
            ? '<div class="video-rank-thumb"><img src="' + thumbUrl + '" alt="' + (v.name || '') + '" loading="lazy"></div>'
            : '<div class="video-rank-thumb video-rank-thumb-placeholder"><i class="fas fa-play"></i></div>'}
          <span class="rank-num">${v.order || ''}</span>
          <div class="rank-info">
            <strong>${v.name || ''}</strong>
            ${v.description ? '<p>' + v.description + '</p>' : ''}
          </div>
        </div>`;
      }).join('');
  }

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
      <div class="media-card" data-gallery-id="${g.id}">
        <div class="media-card-thumb">
          <img src="${g._coverUrl || '/assets/icons/icon-96x96.png'}" alt="${g.title || g.name || ''}" loading="lazy">
          <div class="media-card-overlay"><i class="fas fa-images"></i></div>
          <span class="media-card-badge"><i class="fas fa-camera"></i> ${(g.images || []).length}</span>
        </div>
        <div class="media-card-body">
          <h4>${g.title || g.name || ''}</h4>
          ${g.description ? '<p>' + g.description + '</p>' : ''}
        </div>
      </div>
    `).join('');
  }

  async loadAnnouncersList() {
    const dm = getDataManager();
    const announcers = await dm.loadAnnouncers();
    if (!announcers || !announcers.length) {
      this._toggleSection('announcers-list', false);
      return;
    }
    this._toggleSection('announcers-list', true);
    for (const a of announcers) {
      const img = a.imageUrl || a.photoUrl;
      if (img) a._photoUrl = await dm.getImageUrl(img);
    }
    const container = document.getElementById('announcers-list');
    if (!container) return;
    container.innerHTML = announcers.map(a => {
      const bio = a.biography || a.description || a.bio || a.about || '';
      return `
      <div class="announcer-card">
        <div class="announcer-photo">
          <img src="${a._photoUrl || '/assets/icons/icon-96x96.png'}" alt="${a.name || ''}" loading="lazy">
        </div>
        <h4>${a.name || ''}</h4>
        ${bio ? '<p>' + bio + '</p>' : ''}
      </div>`;
    }).join('');
  }

  async loadSponsorsGrid() {
    const dm = getDataManager();
    const sponsors = await dm.loadSponsors();
    if (!sponsors || !sponsors.length) {
      this._toggleSection('sponsors-list', false);
      return;
    }
    this._toggleSection('sponsors-list', true);
    for (const s of sponsors) {
      if (s.logoUrl) s.logoUrl = await dm.getImageUrl(s.logoUrl);
    }
    const container = document.getElementById('sponsors-list');
    if (!container) return;
    container.innerHTML = sponsors.map(s => `
      <a class="sponsor-card" href="${s.website || '#'}" target="_blank" rel="noopener">
        <img src="${s.logoUrl || '/assets/icons/icon-96x96.png'}" alt="${s.name || ''}" loading="lazy">
        <span>${s.name || ''}</span>
      </a>
    `).join('');
  }

  // FIX: crea el VideoPlayer una sola vez y carga el stream de TV.
  // Antes se chequeaba la URL pero el player nunca se instanciaba.
  _initTVPlayer() {
    if (this._tvPlayer) return;
    const container = document.getElementById('tv-player-container');
    if (!container || !window.VideoPlayer || !this.videoStreamUrl) return;
    this._tvPlayer = new window.VideoPlayer('tv-player-container', {
      autoplay: true,
      controls: false,
      muted: false
    });
    const player = this._tvPlayer;
    const waitForVideo = setInterval(() => {
      if (player.videoElement) {
        clearInterval(waitForVideo);
        player.loadStream(this.videoStreamUrl);
      }
    }, 100);
  }

  _pauseTVPlayer() {
    if (this._tvPlayer && this._tvPlayer.videoElement && !this._tvPlayer.videoElement.paused) {
      this._tvPlayer.videoElement.pause();
    }
  }

  _extractYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  async handleVote(pollId, optionId) {
    const dm = getDataManager();
    try {
      await dm.votePoll(pollId, optionId);
      const polls = await dm.loadPolls();
      const poll = (polls || []).find(p => p.id === pollId);
      if (!poll) return;
      const total = (poll.options || []).reduce((s, o) => s + (o.votes || 0), 0);
      const card = document.querySelector('.poll-card-modern[data-id="' + pollId + '"]');
      if (!card) return;
      card.querySelectorAll('.poll-option-modern').forEach((btn, i) => {
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
      console.error('AppTemplate: Error voting:', error);
    }
  }

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
    container.innerHTML = sorted.map(e => `
      <div class="event-item">
        <div><span class="event-day">${new Date(e.date).getDate()}</span><span class="event-month">${new Date(e.date).toLocaleDateString('es-ES', { month: 'short' })}</span></div>
        <div class="event-info">
          <h3>${e.name}</h3>
          <p>${e.description || ''}${e.time ? ' · ' + e.time : ''}</p>
        </div>
      </div>
    `).join('');
  }

  _populateAbout() {
    const img = document.getElementById('about-radio-img');
    const titleEl = document.getElementById('about-radio-title');
    const descEl = document.getElementById('about-radio-desc');
    if (!img && !titleEl) return;
    const dm = getDataManager();
    import('/assets/js/api.js').then(({ getBasicData }) => {
      getBasicData().then(async data => {
        const dm2 = getDataManager();
        if (img && data.coverUrl) img.src = await dm2.getImageUrl(data.coverUrl);
        else if (img && data.logoUrl) img.src = await dm2.getImageUrl(data.logoUrl);
        if (titleEl) titleEl.textContent = data.projectName || data.name || 'Nuestra Radio';
        if (descEl) descEl.textContent = data.projectDescription || data.description || '';
      }).catch(() => {});
    }).catch(() => {});
  }

  // ===================== VU METER =====================
  // Animación de barras puramente visual (sin tocar el <audio>).
  // Las barras se generan dinámicamente en JS según el ancho del
  // contenedor, para que siempre llenen toda la pantalla.
  _initVuMeter() {
    if (this._vuMeter) return;
    const container = document.getElementById('vumeter');
    const barsEl = document.getElementById('vumeter-bars');
    const audio = document.getElementById('radio-audio');
    if (!container || !barsEl) return;

    const containerH = container.clientHeight || 96;
    const computed = window.getComputedStyle(container);
    const padBottom = parseFloat(computed.paddingBottom) || 0;
    const maxBarH = Math.max(40, containerH - padBottom - 4);

    this._vuMeter = {
      bars: [],
      smoothed: [],
      bands: [],             // { minBin, maxBin } por barra
      container,
      barsEl,
      audio,
      running: false, rafId: null,
      maxBarH,
      intensity: 0.25,
      burstUntil: 0,
      burstStrength: 0,
      bitrateScale: 0.7,
      lastTitle: '',
      hits: [],
      nextHit: 0,
      bpm: 120,
      // Análisis real (si funciona)
      mode: 'fake',
      ctx: null,
      analyser: null,
      data: null,
      stream: null,
      // Configuración del visualizador
      sensitivity: 1.0,     // multiplicador del usuario (la auto-sens
                            // compensa el nivel del audio en runtime)
      minLevel: 0.04,      // piso mínimo — barras nunca vacías
      sampleRate: 44100     // para mapear freq → bin
    };

    this._buildBars();

    // Intenta análisis REAL con captureStream() — no redirige el audio,
    // solo lo lee, así que NO rompe el sonido.
    if (audio) this._tryRealAudio();

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        if (!this._vuMeter) return;
        this._buildBars();
        const cH = this._vuMeter.container.clientHeight || 96;
        const cs = window.getComputedStyle(this._vuMeter.container);
        const pB = parseFloat(cs.paddingBottom) || 0;
        this._vuMeter.maxBarH = Math.max(40, cH - pB - 4);
      });
      ro.observe(container);
      this._vuMeter.ro = ro;
    }

    const titleEl = document.getElementById('track-title-main');
    if (titleEl && window.MutationObserver) {
      this._vuMeter.titleEl = titleEl;
      this._vuMeter.titleObserver = new MutationObserver(() => {
        const t = (titleEl.textContent || '').trim();
        if (t && t !== this._vuMeter.lastTitle) {
          this._vuMeter.lastTitle = t;
          this._vuMeter.burstUntil = performance.now() + 3500;
          this._vuMeter.burstStrength = 1;
        }
      });
      this._vuMeter.titleObserver.observe(titleEl, {
        childList: true, characterData: true, subtree: true
      });
      this._vuMeter.lastTitle = (titleEl.textContent || '').trim();
    }

    this._vuMeter.bitrateTimer = setInterval(() => {
      const el = document.getElementById('bitrate');
      if (!el) return;
      const kbps = parseInt(el.textContent, 10);
      if (!isNaN(kbps) && kbps > 0) {
        this._vuMeter.bitrateScale = Math.min(1, 0.4 + kbps / 400);
      }
    }, 4000);
  }

  // Intenta obtener datos REALES del audio.
  // Como el servidor de ipstream envía Access-Control-Allow-Origin: *,
  // podemos usar createMediaElementSource directamente. El context
  // se crea en respuesta a la interacción del usuario (en onAudioPlay),
  // por lo que arranca en "running" state y el audio sigue sonando.
  //
  // Flujo: <audio> → MediaElementSource → AnalyserNode → destination
  //                                                          ↑ speakers
  _tryRealAudio() {
    const v = this._vuMeter;
    if (!v || !v.audio) return;
    if (v.mode === 'real' || v.source) return; // ya inicializado
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;

      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(v.audio);
      const analyser = ctx.createAnalyser();
      // fftSize 2048 = 1024 bins. Resolución: 44100/2048 ≈ 21.5Hz/bin
      // Con esta resolución distinguimos claramente bajos/medios/agudos
      // y tenemos suficientes bins para definir bandas con buen detalle.
      analyser.fftSize = 2048;
      // Smoothing alto (0.8): el AnalyserNode promedia los frames
      // internamente, dando datos estables. La "bola" del VU meter
      // se hace con lerp en el loop de animación, no acá.
      analyser.smoothingTimeConstant = 0.8;

      source.connect(analyser);
      analyser.connect(ctx.destination); // necesario para que se oiga

      v.ctx = ctx;
      v.source = source;
      v.analyser = analyser;
      v.data = new Uint8Array(analyser.frequencyBinCount);
      v.mode = 'real';
      // Recalculamos bandas con la cantidad real de bins
      if (v.bars.length) {
        const sr = ctx.sampleRate || v.sampleRate;
        v.sampleRate = sr;
        v.bands = this._computeBands(v.bars.length, analyser.frequencyBinCount, sr);
      }
      console.info('VU meter: análisis real habilitado (createMediaElementSource)');
      window.dispatchEvent(new CustomEvent('vumeter:realanalysis', { detail: { vuMeter: this } }));
    } catch (e) {
      console.warn('VU meter: createMediaElementSource falló, probando captureStream', e);
      v.source = null;
      this._tryCaptureStream();
    }
  }

  // Fallback: usa captureStream() que NO redirige el audio.
  // El audio sigue saliendo por la salida por defecto del <audio>.
  _tryCaptureStream() {
    const v = this._vuMeter;
    if (!v || !v.audio) return;
    if (v.mode === 'real') return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const capture = v.audio.captureStream || v.audio.mozCaptureStream;
      if (typeof capture !== 'function') {
        console.info('VU meter: captureStream no soportado, usando animación sintética');
        v.mode = 'fake';
        return;
      }
      const stream = capture.call(v.audio);
      if (!stream) {
        v.mode = 'fake';
        return;
      }
      const ctx = new Ctx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      // NO conectar a destination — el audio sale por el <audio>

      v.ctx = ctx;
      v.analyser = analyser;
      v.data = new Uint8Array(analyser.frequencyBinCount);
      v.stream = stream;
      v.mode = 'real';
      // Recalculamos bandas con la cantidad real de bins
      if (v.bars.length) {
        const sr = ctx.sampleRate || v.sampleRate;
        v.sampleRate = sr;
        v.bands = this._computeBands(v.bars.length, analyser.frequencyBinCount, sr);
      }
      console.info('VU meter: análisis real habilitado (captureStream)');
      window.dispatchEvent(new CustomEvent('vumeter:realaudiofallback', { detail: { vuMeter: this, mode: 'captureStream' } }));
    } catch (e) {
      console.warn('VU meter: captureStream falló, usando animación sintética', e);
      v.mode = 'fake';
    }
  }

  // Construye/regenera el número correcto de barras según el ancho
  // disponible. Cada barra representa una BANDA del espectro (no
  // un bin individual). Las bandas se distribuyen logarítmicamente
  // entre 30Hz y 16kHz, que es como el oído humano percibe las
  // frecuencias.
  _buildBars() {
    const v = this._vuMeter;
    if (!v) return;
    const containerW = v.container.clientWidth;
    if (!containerW) return;

    const cs = window.getComputedStyle(v.barsEl);
    const gap = parseFloat(cs.gap) || parseFloat(cs.columnGap) || 3;
    const minBarW = 6;
    const slot = minBarW + gap;
    const count = Math.max(8, Math.floor(containerW / slot));

    if (v.bars.length === count) {
      // La cantidad no cambió — solo recalculamos bandas si
      // cambió el sampleRate (no debería pasar).
      for (const bar of v.bars) bar.style.height = '14px';
      return;
    }

    v.barsEl.innerHTML = '';
    v.bars = [];
    v.smoothed = new Array(count).fill(0);
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.style.height = '14px';
      frag.appendChild(s);
      v.bars.push(s);
    }
    v.barsEl.appendChild(frag);

    // Calculamos las bandas de frecuencia. Por ahora asumimos
    // 1024 bins (fftSize 2048). Si el analyser tiene otra
    // cantidad, se recalculará cuando se cree.
    v.bands = this._computeBands(count, 1024, v.sampleRate);
  }

  // Divide el espectro en N bandas logarítmicamente espaciadas.
  // Cada banda = { minBin, maxBin } dentro de los `numBins` del
  // AnalyserNode. La escala log (cada banda es un ratio constante
  // más ancha que la anterior) coincide con la percepción humana.
  _computeBands(numBars, numBins, sampleRate) {
    const bands = [];
    // Rango audible útil: 30Hz a 16kHz (la música rara vez tiene
    // energía significativa fuera de este rango, especialmente en
    // streams AAC+ 128kbps donde >16kHz es prácticamente silencio).
    const minFreq = 30;
    const maxFreq = 16000;
    const binWidth = sampleRate / (numBins * 2); // fftSize/2 = numBins

    // Ratio: cada banda es un factor constante más ancha
    const ratio = Math.pow(maxFreq / minFreq, 1 / numBars);

    for (let i = 0; i < numBars; i++) {
      const f1 = minFreq * Math.pow(ratio, i);
      const f2 = minFreq * Math.pow(ratio, i + 1);
      const b1 = Math.max(0, Math.floor(f1 / binWidth));
      const b2 = Math.min(numBins - 1, Math.ceil(f2 / binWidth));
      // Si la banda es muy angosta (bin inicial == bin final),
      // expandimos un bin para tener al menos 1 muestra.
      const maxBin = b2 > b1 ? b2 : b1 + 1;
      bands.push({ minBin: b1, maxBin });
    }
    return bands;
  }

  _startVuMeter() {
    const v = this._vuMeter;
    if (!v || v.running) return;
    v.running = true;
    v.container.classList.add('playing');
    v.targetIntensity = 0.85;

    if (v.smoothed.length !== v.bars.length) {
      v.smoothed = new Array(v.bars.length).fill(0.3);
    }

    v.hits = [];
    v.nextHit = performance.now() * 0.001 + 0.4;
    v.bpm = 120;

    // IMPORTANTE: crear el AudioContext AHORA (en respuesta al click
    // del usuario) hace que arranque en "running" state y el audio
    // se siga oyendo. Si lo creábamos antes, quedaba en "suspended".
    if (v.mode === 'fake') {
      this._tryRealAudio();
    }

    // Reanudar el AudioContext si esta en suspended. _tryRealAudio
    // se llamo durante _initVuMeter (sin gesto del usuario), por
    // lo que el contexto queda en 'suspended' hasta que el usuario
    // interactue. El click del play cuenta como gesto, asi que
    // lo reanudamos aca.
    if (v.ctx && v.ctx.state === 'suspended') {
      v.ctx.resume().catch((err) => {
        console.warn('VU meter: no se pudo reanudar el AudioContext', err);
      });
    }

    const tick = () => {
      if (!v.running) return;
      const now = performance.now();
      const t = now * 0.001;
      v.intensity += (v.targetIntensity - v.intensity) * 0.05;

      // ====== BURST (canción nueva) ======
      let burst = 0;
      if (v.burstUntil > now) {
        const remaining = (v.burstUntil - now) / 3500;
        if (remaining > 0.95) burst = 1.2;
        else burst = v.burstStrength * remaining;
        v.burstStrength *= 0.992;
      }

      // ====== Si tenemos datos REALES, los usamos ======
      let realLevels = null;
      if (v.mode === 'real' && v.analyser) {
        v.analyser.getByteFrequencyData(v.data);
        realLevels = v.data;
      }

      // ====== Beats sintéticos (sólo fallback) ======
      const beatPeriod = 60 / v.bpm;
      const beatPhase = (t % beatPeriod) / beatPeriod;
      const beatHit = Math.exp(-beatPhase * 6) * (1 - beatPhase * 0.3);
      v.bpm += Math.sin(t * 0.13) * 0.05;
      v.bpm = Math.max(95, Math.min(140, v.bpm));

      // ====== Hits aleatorios (snare/hi-hat, sólo fallback) ======
      if (!realLevels && t >= v.nextHit && v.bars.length > 0) {
        v.nextHit = t + 0.3 + Math.random() * 1.2;
        const numHits = 1 + Math.floor(Math.random() * 3);
        for (let h = 0; h < numHits; h++) {
          v.hits.push({
            idx: Math.floor(Math.random() * v.bars.length),
            start: t,
            strength: 0.25 + Math.random() * 0.55
          });
        }
      }
      v.hits = v.hits.filter(h => t - h.start < 0.4);

      const baseIntensity = v.intensity * v.bitrateScale;
      const barsLen = v.bars.length;
      const smoothed = v.smoothed;
      const max = v.maxBarH;
      const dataLen = realLevels ? realLevels.length : 0;

      // =========================================================
      // PIPELINE PROFESIONAL DE ANÁLISIS REAL
      // 4 pasadas + auto-sensibilidad + soft-knee compression.
      // Sin AGC (que saturaba), sin cap duro.
      // =========================================================
      if (realLevels && v.bands && v.bands.length === barsLen) {
        // Buffers persistentes (se crean una vez, se reusan)
        if (!v._raw || v._raw.length !== barsLen) {
          v._raw = new Array(barsLen);
          v._prop = new Array(barsLen);
        }

        // ---- Pasada 1: Promedio por banda ----
        for (let i = 0; i < barsLen; i++) {
          const band = v.bands[i];
          let sum = 0, count = 0;
          const bmax = Math.min(band.maxBin + 1, dataLen);
          for (let j = band.minBin; j < bmax; j++) {
            sum += realLevels[j];
            count++;
          }
          v._raw[i] = (count > 0 ? sum / count : 0) / 255;
        }

        // ---- Pasada 2: Propagación de energía entre vecinos ----
        for (let i = 0; i < barsLen; i++) v._prop[i] = 0;
        for (let i = 0; i < barsLen; i++) {
          const energy = v._raw[i];
          if (energy > 0.05) {
            const f1 = energy * 0.10;
            const f2 = energy * 0.05;
            const f3 = energy * 0.025;
            if (i + 1 < barsLen) v._prop[i + 1] += f1;
            if (i + 2 < barsLen) v._prop[i + 2] += f2;
            if (i + 3 < barsLen) v._prop[i + 3] += f3;
            if (i - 1 >= 0) v._prop[i - 1] += f1;
            if (i - 2 >= 0) v._prop[i - 2] += f2;
            if (i - 3 >= 0) v._prop[i - 3] += f3;
          }
        }

        // ---- AUTO-SENSITIVIDAD BASADA EN ENERGÍA PROMEDIO ----
        // En vez de AGC (que forzaba al max), medimos la energía
        // PROMEDIO de los RAW de los últimos ~2 seg y ajustamos
        // la sensibilidad para que el promedio de barras quede
        // en ~50% del alto. Así la altura refleja la intensidad
        // REAL de la música, sin escalar al max constantemente.
        let rawSum = 0;
        for (let i = 0; i < barsLen; i++) rawSum += v._raw[i];
        const rawAvg = rawSum / barsLen;

        // EMA lento de la energía promedio (half-life ~2 seg)
        if (v.longEnergy === undefined) v.longEnergy = 0.2;
        v.longEnergy = v.longEnergy * 0.995 + rawAvg * 0.005;

        // Auto-sens: target = 0.5 (50% del alto). Clamped [0.4, 2.5]
        const TARGET = 0.5;
        const autoSens = Math.max(0.4, Math.min(2.5,
          TARGET / Math.max(v.longEnergy, 0.05)
        ));
        const finalSens = autoSens * v.sensitivity;

        // ---- SOFT KNEE COMPRESSION (sin límite duro) ----
        // Por debajo de knee=0.5 es lineal. Por encima se comprime
        // con una curva exponencial que tiene un asymptote en
        // knee + maxGain = 0.5 + 0.35 = 0.85. Esto da el margen
        // superior del 15% sin un cap duro.
        const knee = 0.5;
        const maxGain = 0.35;
        const softKnee = (x) => {
          if (x <= knee) return x;
          return knee + maxGain * (1 - Math.exp(-(x - knee) * 2.5));
        };

        // ---- Pasada 3: Suavizado + soft-knee + VU ballistics ----
        for (let i = 0; i < barsLen; i++) {
          const combined = v._raw[i] + v._prop[i];
          const left = i > 0 ? v._raw[i - 1] + v._prop[i - 1] : combined;
          const right = i < barsLen - 1
            ? v._raw[i + 1] + v._prop[i + 1]
            : combined;
          const hSmooth = combined * 0.5 + left * 0.25 + right * 0.25;

          // Aplicar sensitivity (auto-ajustada)
          let level = hSmooth * finalSens;

          // Soft knee compression (asymptote ~0.85 = 15% top margin)
          level = softKnee(level);

          // Piso mínimo: barras nunca completamente vacías
          level = Math.max(v.minLevel, level);

          // VU BALLISTICS — ataque rápido, decay lento
          // (lerp sin cap duro: el smoothed puede subir libremente,
          // el soft-knee garantiza que se mantiene en rango sano)
          const prev = smoothed[i];
          const lerpFactor = level > prev ? 0.50 : 0.08;
          const next = prev + (level - prev) * lerpFactor;
          smoothed[i] = next < 0 ? 0 : next;

          // Altura visual con cap al container (sin saturar)
          const visualLevel = smoothed[i] > 1 ? 1 : smoothed[i];
          v.bars[i].style.height = (6 + visualLevel * (max - 6)) + 'px';
        }
        // Saltamos el for sintético
        v.rafId = requestAnimationFrame(tick);
        return;
      }

      for (let i = 0; i < barsLen; i++) {
        const norm = i / barsLen;
        let h;

        if (realLevels && v.bands && v.bands[i]) {
          // (El procesamiento real se hace en bloque separado
          // arriba del for; acá sólo manejamos el caso 1-por-barra
          // que ya no se usa con el nuevo pipeline).
          // Fallback: usar el mismo valor crudo como nivel.
          let level = realLevels[i] / 255 || 0;
          level *= v.sensitivity;
          level = Math.max(v.minLevel, level);
          level = Math.min(0.95, level);
          const prev = smoothed[i];
          const lerpFactor = level > prev ? 0.5 : 0.08;
          const next = prev + (level - prev) * lerpFactor;
          smoothed[i] = next < 0 ? 0 : (next > 1 ? 1 : next);
          v.bars[i].style.height = (6 + smoothed[i] * (max - 6)) + 'px';
          continue;
        } else {
          // ==== FALLBACK SINTÉTICO ====
          const dx = (norm - 0.35) * 1.8;
          const spectrum = Math.max(0.15, 1 - dx * dx);
          const bandWeight = spectrum;
          const bass = 0.5 + 0.5 * Math.sin(t * 1.4 + norm * 2.5);
          const mid = 0.5 + 0.5 * Math.sin(t * 3.5 + norm * 5.5);
          const treble = 0.5 + 0.5 * Math.sin(t * 7.5 + norm * 10);
          h = bass * 0.22 + mid * 0.18 + treble * 0.10;
          h *= bandWeight;
          const beatZone = Math.max(0, 1 - norm * 1.4);
          h += beatHit * beatZone * 0.55;
          for (let hi = 0; hi < v.hits.length; hi++) {
            const hit = v.hits[hi];
            if (hit.idx === i) {
              const age = t - hit.start;
              const hitEnv = Math.exp(-age * 12);
              const hitZone = 0.4 + norm * 0.7;
              h += hit.strength * hitEnv * hitZone;
            }
          }
          h += (Math.random() - 0.5) * 0.08;
        }

        if (burst > 0) h += burst * 0.6;

        const final = 0.10 + Math.max(0, h) * baseIntensity;

        // ATTACK RÁPIDO / RELEASE RÁPIDO — las barras bajan visiblemente
        // entre beats. 50/50 en cada dirección.
        const prev = smoothed[i];
        const attack = final > prev;
        let next = attack
          ? prev * 0.50 + final * 0.50
          : prev * 0.50 + final * 0.50;
        // Clamp a [0, 1]
        if (next < 0) next = 0;
        else if (next > 1) next = 1;
        smoothed[i] = next;

        v.bars[i].style.height = (6 + next * (max - 6)) + 'px';
      }

      v.rafId = requestAnimationFrame(tick);
    };

    tick();
  }

  // Getters para que el AudioEnhancer (assets/js/audio-enhancer.js)
  // pueda re-cablear el grafo de Web Audio de este VU meter local
  // sin necesidad de un segundo createMediaElementSource.
  getAudioContext() {
    return this._vuMeter ? this._vuMeter.ctx : null;
  }

  getSourceNode() {
    return this._vuMeter ? this._vuMeter.source : null;
  }

  getAnalyserNode() {
    return this._vuMeter ? this._vuMeter.analyser : null;
  }

  isRealAnalysisActive() {
    return !!(this._vuMeter && this._vuMeter.mode === 'real' && this._vuMeter.source);
  }

  _stopVuMeter() {
    const v = this._vuMeter;
    if (!v) return;
    // Bajamos la intensidad pero dejamos el loop corriendo
    // un instante para que la transición sea suave.
    v.targetIntensity = 0.15;
    v.container.classList.remove('playing');

    // Cancelamos el loop solo cuando la intensidad ya bajó
    const waitFade = () => {
      if (!v.running) return;
      if (v.intensity > 0.18) {
        requestAnimationFrame(waitFade);
        return;
      }
      v.running = false;
      if (v.rafId) cancelAnimationFrame(v.rafId);
      // Altura idle: barras escalonadas para que no queden todas iguales
      for (let i = 0; i < v.bars.length; i++) {
        v.bars[i].style.height = (8 + (i % 5) * 3) + 'px';
      }
    };
    requestAnimationFrame(waitFade);
  }

  setupBottomNav() {
    const navItems = document.querySelectorAll('.nav-item');
    const moreBtn = document.getElementById('nav-more-btn');
    const overflow = document.getElementById('nav-overflow');
    const overflowContent = document.getElementById('nav-overflow-content');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        this._navClick(item.dataset.tab, item);
      });
    });

    this._updateNavOverflow();

    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        const isOpen = overflow.style.display !== 'none';
        overflow.style.display = isOpen ? 'none' : 'block';
      });
    }

    document.addEventListener('click', (e) => {
      if (overflow && overflow.style.display !== 'none') {
        if (!e.target.closest('#nav-overflow') && !e.target.closest('#nav-more-btn')) {
          overflow.style.display = 'none';
        }
      }
    });

    if (overflowContent) {
      overflowContent.addEventListener('click', (e) => {
        const item = e.target.closest('.nav-item');
        if (item) {
          item.click();
        }
      });
    }

    this._updateNavOverflow();
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this._updateNavOverflow(), 200);
    });
  }

  _updateNavOverflow() {
    const nav = document.getElementById('bottom-nav');
    const moreBtn = document.getElementById('nav-more-btn');
    const overflowContent = document.getElementById('nav-overflow-content');
    if (!nav || !moreBtn || !overflowContent) return;

    // Only consider items that have data (not hidden by _toggleSection)
    const visibleItems = Array.from(nav.querySelectorAll('.nav-item')).filter(
      item => item.style.display !== 'none'
    );

    // Items hidden by _toggleSection (no data) stay hidden and are excluded
    const hiddenItems = Array.from(nav.querySelectorAll('.nav-item')).filter(
      item => item.style.display === 'none'
    );
    hiddenItems.forEach(item => { item.style.display = 'none'; });

    // Measure which visible items fit on screen
    const navW = nav.clientWidth;
    const moreW = 50;
    let totalW = 0;
    let fits = [];
    let overflow = [];

    visibleItems.forEach(item => {
      const w = item.offsetWidth || 50;
      const gap = 2;
      if (totalW + w + gap + moreW <= navW) {
        fits.push(item);
        totalW += w + gap;
      } else {
        overflow.push(item);
      }
    });

    if (overflow.length > 0) {
      moreBtn.style.display = 'flex';
      overflow.forEach(item => { item.style.display = 'none'; });
      overflowContent.innerHTML = '';
      overflow.forEach(item => {
        const clone = item.cloneNode(true);
        clone.style.display = 'flex';
        clone.addEventListener('click', () => this._navClick(clone.dataset.tab, item));
        overflowContent.appendChild(clone);
      });
    } else {
      moreBtn.style.display = 'none';
      overflowContent.innerHTML = '';
    }
  }

  _navClick(tab, originalItem) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    originalItem.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const target = document.getElementById('tab-' + tab);
    if (target) target.classList.add('active');
    document.getElementById('nav-overflow').style.display = 'none';

    // FIX: inicializa el player de TV al entrar y lo pausa al salir
    if (tab === 'tv') this._initTVPlayer();
    else this._pauseTVPlayer();
  }

  setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
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
          if (feedback) { feedback.className = 'contact-feedback success'; feedback.textContent = data.message || 'Gracias por tu mensaje. Te responderemos pronto.'; feedback.style.display = 'block'; }
          form.reset();
        } else {
          throw new Error(data.message || 'Error al enviar el mensaje');
        }
      } catch (err) {
        if (feedback) { feedback.className = 'contact-feedback error'; feedback.textContent = err.message || 'Error al enviar el mensaje. Intenta de nuevo.'; feedback.style.display = 'block'; }
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i><span>Enviar</span>';
      }
    });
  }

  setupModalHandlers() {
    document.querySelectorAll('.modal').forEach(modal => {
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal(modal.id));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal.id);
      });
    });

    document.addEventListener('click', (e) => {
      const slug = e.target.closest('[data-slug]');
      if (slug) {
        e.preventDefault();
        this.loadNewsDetail(slug.dataset.slug);
        return;
      }
      const pollOpt = e.target.closest('.poll-option-modern');
      if (pollOpt && !pollOpt.disabled) {
        this.handleVote(pollOpt.dataset.pollId, pollOpt.dataset.optionId);
        return;
      }
      const videoCast = e.target.closest('[data-videocast-id]');
      if (videoCast) {
        e.preventDefault();
        this.openVideocastModal(videoCast.dataset.videocastId);
        return;
      }
      const videoItem = e.target.closest('.video-rank-item');
      if (videoItem) {
        e.preventDefault();
        const url = videoItem.dataset.url;
        if (url) this.openVideoModal(url);
        return;
      }
      const galleryCard = e.target.closest('[data-gallery-id]');
      if (galleryCard) {
        e.preventDefault();
        this.openGalleryModal(galleryCard.dataset.galleryId);
        return;
      }
    });
  }

  async openVideocastModal(id) {
    const dm = getDataManager();
    const vc = await dm.loadVideocastById(id);
    if (!vc) return;
    const body = document.getElementById('videocast-modal-body');
    if (!body) return;
    const videoId = this._extractYouTubeId(vc.videoUrl);
    body.innerHTML = videoId
      ? `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>
         <h2>${vc.title || ''}</h2>
         <p>${vc.description || ''}</p>`
      : '<p>Video no disponible</p>';
    this.openModal('videocast-modal');
  }

  openVideoModal(url) {
    const videoId = this._extractYouTubeId(url);
    const body = document.getElementById('video-modal-body');
    if (!body) return;
    body.innerHTML = videoId
      ? `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`
      : '<p>Video no disponible</p>';
    this.openModal('video-modal');
  }

  async openGalleryModal(id) {
    const dm = getDataManager();
    const galleries = await dm.loadGalleries();
    const gallery = (galleries || []).find(g => g.id == id);
    if (!gallery) return;
    const body = document.getElementById('gallery-modal-body');
    const thumbs = document.getElementById('gallery-thumbnails');
    if (body && gallery.images && gallery.images.length) {
      const first = await dm.getImageUrl(gallery.images[0].imageUrl);
      body.innerHTML = `<img src="${first}" class="gallery-main-img" alt="">`;
    } else if (body) {
      body.innerHTML = '<p style="text-align:center;padding:40px;">Sin imágenes</p>';
    }
    if (thumbs && gallery.images) {
      const sorted = [...gallery.images].sort((a, b) => (a.order || 0) - (b.order || 0));
      const items = await Promise.all(sorted.map(async img => {
        const url = await dm.getImageUrl(img.imageUrl);
        return `<img src="${url}" class="gallery-thumb" data-url="${url}">`;
      }));
      thumbs.innerHTML = items.join('');
      thumbs.querySelectorAll('.gallery-thumb').forEach(t => {
        t.addEventListener('click', () => {
          const main = document.querySelector('.gallery-main-img');
          if (main) main.src = t.dataset.url;
        });
      });
    }
    this.openModal('gallery-modal');
  }

  async loadNewsDetail(slug) {
    const dm = getDataManager();
    const news = await dm.loadNewsBySlug(slug);
    if (!news) return;
    if (news.imageUrl) news.imageUrl = await dm.getImageUrl(news.imageUrl);
    const body = document.getElementById('news-modal-body');
    if (!body) return;
    body.innerHTML = '<h2>' + news.name + '</h2>' + (news.imageUrl ? '<img src="' + news.imageUrl + '" alt="' + news.name + '">' : '') + '<div class="news-content">' + (news.longText || news.description || news.shortText || '') + '</div><small>' + new Date(news.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) + '</small>';
    this.openModal('news-modal');
  }

  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
  }

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
  }

  _toggleSection(containerId, hasData) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const section = container.closest('.section');
    if (section) section.style.display = hasData ? '' : 'none';

    const navMap = {
      'all-news-grid': 'news',
      'day-nav': 'programs',
      'podcasts-list': 'podcasts',
      'videocasts-list': 'videocasts',
      'videos-ranking': 'videos',
      'galleries-list': 'galleries',
      'announcers-list': 'announcers',
      'sponsors-list': 'sponsors',
      'tv-player-container': 'tv',
      'polls-grid': 'polls',
      'events-timeline': 'events'
    };
    const tabName = navMap[containerId];
    if (tabName) {
      const navItem = document.querySelector('.nav-item[data-tab="' + tabName + '"]');
      if (navItem) navItem.style.display = hasData ? '' : 'none';
    }
  }

  onAudioPlay() {
    super.onAudioPlay();
    const cover = document.getElementById('cover-card');
    if (cover) {
      cover.classList.add('playing');
      cover.classList.remove('paused');
    }
    const playBtn = document.getElementById('main-play-btn');
    if (playBtn) {
      const span = playBtn.querySelector('span');
      if (span) span.textContent = 'EN VIVO';
    }
    // Arranca la animación del VU meter (no toca el <audio>)
    this._initVuMeter();
    this._startVuMeter();
  }

  onAudioPause() {
    super.onAudioPause();
    const cover = document.getElementById('cover-card');
    if (cover) {
      cover.classList.remove('playing');
      cover.classList.add('paused');
    }
    const playBtn = document.getElementById('main-play-btn');
    if (playBtn) {
      const span = playBtn.querySelector('span');
      if (span) span.textContent = 'ESCUCHAR EN VIVO';
    }
    // Detiene y resetea el VU meter
    this._stopVuMeter();
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

  onCurrentSongLoaded(songData) {
    const cover = document.getElementById('cover-card');
    if (cover) cover.classList.remove('paused');
    const titleEl = document.getElementById('track-title-main');
    const artistEl = document.getElementById('track-artist-main');
    const coverImg = document.getElementById('cover-artwork');
    const artUrl = songData.art || '';
    if (titleEl) titleEl.textContent = songData.title || 'Radio';
    if (artistEl) artistEl.textContent = songData.artist || 'En Vivo';
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

  destroy() {
    // Limpia recursos del VU meter
    if (this._vuMeter) {
      if (this._vuMeter.running && this._vuMeter.rafId) {
        cancelAnimationFrame(this._vuMeter.rafId);
      }
      // Desconecta y cierra el AudioContext para liberar recursos
      try {
        if (this._vuMeter.source) this._vuMeter.source.disconnect();
        if (this._vuMeter.analyser) this._vuMeter.analyser.disconnect();
        if (this._vuMeter.ctx && this._vuMeter.ctx.state !== 'closed') {
          this._vuMeter.ctx.close();
        }
      } catch (e) { /* ignore */ }
      if (this._vuMeter.ro) this._vuMeter.ro.disconnect();
      if (this._vuMeter.titleObserver) this._vuMeter.titleObserver.disconnect();
      if (this._vuMeter.bitrateTimer) clearInterval(this._vuMeter.bitrateTimer);
      this._vuMeter = null;
    }
    // Pausa el TV si estaba activo
    this._pauseTVPlayer();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.appTemplate = new AppTemplate();
    await window.appTemplate.init();
  } catch (error) {
    console.error('AppTemplate: Error creating instance:', error);
  }
});

window.addEventListener('beforeunload', () => {
  if (window.appTemplate) window.appTemplate.destroy();
});

export default AppTemplate;
