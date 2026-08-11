import TemplateBase from '/assets/js/template-base.js';
import { getDataManager } from '/assets/js/data-manager.js';

class TradicionalTemplate extends TemplateBase {
  constructor() {
    super({
      audioElementId: 'radio-audio',
      playButtonId: 'play-btn',
      volumeSliderId: 'volume-slider',
      defaultVolume: 50,
      socialContainerIds: ['social-links', 'about-social'],
      customDomIds: {
        radioLogo: 'radio-logo',
        footerRadioName: 'footer-radio-name',
        trackTitle: 'track-title',
        trackArtist: 'track-artist',
        listenersCount: 'listeners-count',
        bitrate: 'bitrate',
        audioQuality: 'audio-quality',
        trackArtwork: 'track-artwork',
        defaultArtwork: 'default-artwork',
        currentDate: 'current-date'
      }
    });

    this.currentPage = { news: 1, podcasts: 1, videocasts: 1 };
    this._hasMore = { news: true, podcasts: true, videocasts: true };
    this._loadingMore = { news: false, podcasts: false, videocasts: false };
    this._programDayMap = {};
    this._selectedDay = 'Lunes';
    this.videoStreamUrl = null;
    this._tvMode = 'radio';
    this._tabMap = {
      'featured-news-grid': 'news',
      'all-news-grid': 'news',
      'all-news-grid-full': 'news',
      'programs-timeline': 'programs',
      'podcasts-list': 'podcasts',
      'videocasts-list': 'videocasts',
      'videos-ranking': 'videos',
      'polls-container': 'polls',
      'events-timeline': 'events',
      'sponsors-grid': 'sponsors',
      'announcers-grid': 'announcers',
      'galleries-list': 'galleries',
      'recent-tracks': 'tracks'
    };
  }

  async init() {
    await super.init();
    try {
      await this.checkTV();
      await this.loadAllContent();
      this.setupTabs();
      this.setupLoadMore();
      this.setupModalHandlers();
      this.setupContactForm();
      this.setupCarousels();
      console.log('TradicionalTemplate: initialized');
    } catch (error) {
      console.error('TradicionalTemplate: init error:', error);
    }
  }

  onBasicDataLoaded(data) {
    if (this._radioCoverUrl) {
      const img = document.getElementById('track-artwork');
      const def = document.getElementById('default-artwork');
      const heroImg = document.getElementById('hero-track-artwork');
      const heroDef = document.getElementById('hero-cover-default');
      if (img) {
        img.src = this._radioCoverUrl;
        img.style.display = 'block';
        if (def) def.style.display = 'none';
      }
      if (heroImg) {
        heroImg.src = this._radioCoverUrl;
        heroImg.style.display = 'block';
        if (heroDef) heroDef.style.display = 'none';
      }
    }
  }

  async checkTV() {
    try {
      const dm = getDataManager();
      this.videoStreamUrl = await dm.loadVideoStreamUrl();
    } catch (e) { this._tvMode = 'radio'; }
  }

  async loadAllContent() {
    await Promise.allSettled([
      this.loadAllNews(),
      this.loadPrograms(),
      this.loadPodcastsList(),
      this.loadVideocastsList(),
      this.loadVideosRanking(),
      this.loadPolls(),
      this.loadEventsTimeline(),
      this.loadSponsors(),
      this.loadAnnouncersGrid(),
      this.loadGalleriesList(),
      this.loadRecentTracks(),
      this.populateAbout()
    ]);
  }

  setupTabs() {
    const items = document.querySelectorAll('.topnav-item');
    const nav = document.getElementById('topnav');
    const toggle = document.getElementById('nav-toggle');
    const close = document.getElementById('nav-close');
    const overlay = document.getElementById('nav-overlay');

    const closeMenu = () => {
      nav?.classList.remove('open');
      toggle?.classList.remove('open');
      overlay?.classList.remove('open');
    };

    const switchTab = (tab, el) => {
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      items.forEach(n => n.classList.remove('active'));
      const target = document.getElementById('tab-' + tab);
      if (target) target.classList.add('active');
      if (el) el.classList.add('active');
      document.querySelector('.main')?.scrollTo({ top: 0, behavior: 'smooth' });
      closeMenu();
    };
    items.forEach(item => {
      item.addEventListener('click', () => switchTab(item.dataset.tab, item));
    });
    if (toggle) {
      toggle.addEventListener('click', () => {
        nav?.classList.toggle('open');
        toggle.classList.toggle('open');
        overlay?.classList.toggle('open');
      });
    }
    if (close) close.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);
    if (document.querySelector('#tab-hero')) switchTab('hero', items[0]);
  }

  // ==================== NOTICIAS ====================

  async loadAllNews() {
    const dm = getDataManager();
    const result = await dm.loadNews(1, 10);
    if (!result.data || !result.data.length) {
      this.toggleSection('featured-news-grid', false);
      this.toggleSection('all-news-grid', false);
      this.toggleSection('all-news-grid-full', false);
      return;
    }
    this.toggleSection('featured-news-grid', true);
    this.toggleSection('all-news-grid', true);
    this.toggleSection('all-news-grid-full', true);

    for (const item of result.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }

    const featured = document.getElementById('featured-news-grid');
    if (featured) {
      const top = result.data.slice(0, 3);
      featured.innerHTML = top.map((item, i) => '<article class="nf-card" data-slug="' + item.slug + '" style="--i:' + i + '">' +
        '<div class="nf-bg" style="background-image:url(\'' + (item.imageUrl || '') + '\')"></div>' +
        '<div class="nf-overlay"></div>' +
        '<div class="nf-content">' +
          '<span class="nf-cat">Noticia</span>' +
          '<h3>' + item.name + '</h3>' +
          '<p>' + (item.shortText || '') + '</p>' +
          '<time>' + new Date(item.createdAt).toLocaleDateString('es-ES') + '</time>' +
        '</div></article>'
      ).join('');
    }

    const renderGrid = (id) => {
      const cont = document.getElementById(id);
      if (!cont) return;
      cont.innerHTML = result.data.map(item =>
        '<article class="n-card" data-slug="' + item.slug + '">' +
          (item.imageUrl ? '<div class="n-card-img"><img src="' + item.imageUrl + '" alt="' + item.name + '" loading="lazy"></div>' : '') +
          '<div class="n-card-body">' +
            '<h3>' + item.name + '</h3>' +
            '<p>' + (item.shortText || '') + '</p>' +
            '<time>' + new Date(item.createdAt).toLocaleDateString('es-ES') + '</time>' +
          '</div></article>'
      ).join('');
    };
    renderGrid('all-news-grid');
    renderGrid('all-news-grid-full');

    this._hasMore.news = result.pagination?.hasMore ?? false;
    document.getElementById('news-more').style.display = this._hasMore.news ? 'flex' : 'none';
    document.getElementById('news-more-full').style.display = this._hasMore.news ? 'flex' : 'none';
  }

  async loadMoreNews() {
    if (this._loadingMore.news || !this._hasMore.news) return;
    this._loadingMore.news = true;
    this.currentPage.news++;
    const dm = getDataManager();
    const result = await dm.loadNews(this.currentPage.news, 10);
    if (!result.data || !result.data.length) {
      this._hasMore.news = false;
      document.getElementById('news-more').style.display = 'none';
      document.getElementById('news-more-full').style.display = 'none';
      this._loadingMore.news = false;
      return;
    }
    for (const item of result.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    const html = result.data.map(item =>
      '<article class="n-card" data-slug="' + item.slug + '">' +
        (item.imageUrl ? '<div class="n-card-img"><img src="' + item.imageUrl + '" alt="' + item.name + '" loading="lazy"></div>' : '') +
        '<div class="n-card-body">' +
          '<h3>' + item.name + '</h3>' +
          '<p>' + (item.shortText || '') + '</p>' +
          '<time>' + new Date(item.createdAt).toLocaleDateString('es-ES') + '</time>' +
        '</div></article>'
    ).join('');
    ['all-news-grid', 'all-news-grid-full'].forEach(id => {
      const c = document.getElementById(id);
      if (c) c.insertAdjacentHTML('beforeend', html);
    });
    this._hasMore.news = result.pagination?.hasMore ?? false;
    document.getElementById('news-more').style.display = this._hasMore.news ? 'flex' : 'none';
    document.getElementById('news-more-full').style.display = this._hasMore.news ? 'flex' : 'none';
    this._loadingMore.news = false;
  }

  async loadNewsDetail(slug) {
    const dm = getDataManager();
    const news = await dm.loadNewsBySlug(slug);
    if (!news) return;
    if (news.imageUrl) news.imageUrl = await dm.getImageUrl(news.imageUrl);
    const body = document.getElementById('news-modal-body');
    if (!body) return;
    body.innerHTML = '<h2>' + news.name + '</h2>' +
      (news.imageUrl ? '<img src="' + news.imageUrl + '" alt="' + news.name + '">' : '') +
      '<div class="news-content">' + (news.longText || news.description || news.shortText || '') + '</div>' +
      '<small>' + new Date(news.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) + (news.author ? ' — ' + news.author : '') + '</small>';
    this.openModal('news-modal');
  }

  // ==================== PROGRAMAS ====================

  async loadPrograms() {
    const dm = getDataManager();
    const programs = await dm.loadPrograms();
    if (!programs || !programs.length) {
      this.toggleSection('programs-timeline', false);
      return;
    }
    this.toggleSection('programs-timeline', true);
    for (const p of programs) {
      if (p.imageUrl) p.imageUrl = await dm.getImageUrl(p.imageUrl);
    }
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
    const todayIdx = new Date().getDay();
    const daysOrder = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    this._selectedDay = daysOrder[todayIdx];
    if (!this._programDayMap[this._selectedDay]) {
      this._selectedDay = Object.keys(this._programDayMap)[0] || 'Lunes';
    }
    this.renderPrograms();
    this.setupDayNav();
  }

  renderPrograms() {
    const container = document.getElementById('programs-timeline');
    if (!container) return;
    const dayPrograms = (this._programDayMap[this._selectedDay] || [])
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    if (!dayPrograms.length) {
      container.innerHTML = '<p class="empty-msg">Sin programación este día</p>';
      return;
    }
    container.innerHTML = dayPrograms.map(p => '<div class="prog-card">' +
      (p.imageUrl ? '<div class="prog-img"><img src="' + p.imageUrl + '" alt="' + p.name + '" loading="lazy"></div>' : '') +
      '<div class="prog-time">' + (p.startTime || '') + (p.endTime ? ' – ' + p.endTime : '') + '</div>' +
      '<div class="prog-body">' +
        '<h3 class="prog-name">' + p.name + '</h3>' +
        (p.host ? '<span class="prog-host">Por ' + p.host + '</span>' : '') +
        (p.description ? '<p class="prog-desc">' + p.description + '</p>' : '') +
      '</div></div>'
    ).join('');
  }

  setupDayNav() {
    const nav = document.getElementById('day-nav');
    if (!nav) return;
    nav.querySelectorAll('.day-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const names = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
          jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };
        const name = names[btn.dataset.day];
        if (!name || name === this._selectedDay) return;
        this._selectedDay = name;
        nav.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderPrograms();
      });
    });
    const keys = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
      jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };
    const ak = Object.keys(keys).find(k => keys[k] === this._selectedDay);
    const ab = nav.querySelector('[data-day="' + ak + '"]');
    if (ab) ab.classList.add('active');
  }

  // ==================== PODCASTS ====================

  async loadPodcastsList() {
    const dm = getDataManager();
    const result = await dm.loadPodcasts(this.currentPage.podcasts, 8);
    if (!result.data || !result.data.length) {
      this.toggleSection('podcasts-list', false);
      return;
    }
    this.toggleSection('podcasts-list', true);
    for (const item of result.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    const container = document.getElementById('podcasts-list');
    if (!container) return;
    container.innerHTML = result.data.map(p => '<div class="pod-card" data-id="' + p.id + '">' +
      '<div class="pod-thumb"><img src="' + (p.imageUrl || '') + '" alt="' + p.title + '" loading="lazy"></div>' +
      '<div class="pod-body">' +
        '<h3>' + p.title + '</h3>' +
        '<small>' + (p.duration || '') + (p.duration ? ' · ' : '') + new Date(p.createdAt).toLocaleDateString('es-ES') + '</small>' +
      '</div></div>'
    ).join('');
    this._hasMore.podcasts = result.pagination?.hasMore ?? false;
    document.getElementById('podcasts-more').style.display = this._hasMore.podcasts ? 'flex' : 'none';
  }

  async loadMorePodcasts() {
    if (this._loadingMore.podcasts || !this._hasMore.podcasts) return;
    this._loadingMore.podcasts = true;
    this.currentPage.podcasts++;
    const dm = getDataManager();
    const result = await dm.loadPodcasts(this.currentPage.podcasts, 8);
    if (!result.data || !result.data.length) {
      this._hasMore.podcasts = false;
      document.getElementById('podcasts-more').style.display = 'none';
      this._loadingMore.podcasts = false;
      return;
    }
    for (const item of result.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    const container = document.getElementById('podcasts-list');
    if (container) {
      container.insertAdjacentHTML('beforeend', result.data.map(p => '<div class="pod-card" data-id="' + p.id + '">' +
        '<div class="pod-thumb"><img src="' + (p.imageUrl || '') + '" alt="' + p.title + '" loading="lazy"></div>' +
        '<div class="pod-body">' +
          '<h3>' + p.title + '</h3>' +
          '<small>' + (p.duration || '') + (p.duration ? ' · ' : '') + new Date(p.createdAt).toLocaleDateString('es-ES') + '</small>' +
        '</div></div>'
      ).join(''));
    }
    this._hasMore.podcasts = result.pagination?.hasMore ?? false;
    document.getElementById('podcasts-more').style.display = this._hasMore.podcasts ? 'flex' : 'none';
    this._loadingMore.podcasts = false;
  }

  async loadPodcastDetail(id) {
    const dm = getDataManager();
    const podcast = await dm.loadPodcastById(id);
    if (!podcast) return;
    if (podcast.imageUrl) podcast.imageUrl = await dm.getImageUrl(podcast.imageUrl);
    const body = document.getElementById('podcast-modal-body');
    const audio = document.getElementById('podcast-audio');
    if (body) {
      body.innerHTML = '<h2>' + podcast.title + '</h2>' +
        (podcast.imageUrl ? '<img src="' + podcast.imageUrl + '" alt="' + podcast.title + '">' : '') +
        '<p>' + (podcast.description || podcast.shortText || '') + '</p>';
    }
    if (audio) { audio.src = podcast.audioUrl || podcast.fileUrl || podcast.url || ''; audio.load(); }
    this.openModal('podcast-modal');
    if (audio) audio.play().catch(() => {});
  }

  // ==================== VIDECASTS ====================

  async loadVideocastsList() {
    const dm = getDataManager();
    const result = await dm.loadVideocasts(this.currentPage.videocasts, 8);
    if (!result.data || !result.data.length) {
      this.toggleSection('videocasts-list', false);
      return;
    }
    this.toggleSection('videocasts-list', true);
    const container = document.getElementById('videocasts-list');
    if (!container) return;
    container.innerHTML = result.data.map(v => '<div class="vc-card" data-id="' + v.id + '">' +
      '<div class="vc-thumb" style="background-image:url(\'' + (v.imageUrl || '') + '\')"><div class="vc-play"><i class="fas fa-play"></i></div></div>' +
      '<div class="vc-body"><h3>' + v.title + '</h3></div></div>'
    ).join('');
    this._hasMore.videocasts = result.pagination?.hasMore ?? false;
    document.getElementById('videocasts-more').style.display = this._hasMore.videocasts ? 'flex' : 'none';
  }

  async loadMoreVideocasts() {
    if (this._loadingMore.videocasts || !this._hasMore.videocasts) return;
    this._loadingMore.videocasts = true;
    this.currentPage.videocasts++;
    const dm = getDataManager();
    const result = await dm.loadVideocasts(this.currentPage.videocasts, 8);
    if (!result.data || !result.data.length) {
      this._hasMore.videocasts = false;
      document.getElementById('videocasts-more').style.display = 'none';
      this._loadingMore.videocasts = false;
      return;
    }
    const container = document.getElementById('videocasts-list');
    if (container) {
      container.insertAdjacentHTML('beforeend', result.data.map(v => '<div class="vc-card" data-id="' + v.id + '">' +
        '<div class="vc-thumb" style="background-image:url(\'' + (v.imageUrl || '') + '\')"><div class="vc-play"><i class="fas fa-play"></i></div></div>' +
        '<div class="vc-body"><h3>' + v.title + '</h3></div></div>'
      ).join(''));
    }
    this._hasMore.videocasts = result.pagination?.hasMore ?? false;
    document.getElementById('videocasts-more').style.display = this._hasMore.videocasts ? 'flex' : 'none';
    this._loadingMore.videocasts = false;
  }

  async loadVideocastDetail(id) {
    const dm = getDataManager();
    const vc = await dm.loadVideocastById(id);
    if (!vc) return;
    const body = document.getElementById('videocast-modal-body');
    if (!body) return;
    const vid = this.extractYouTubeId(vc.videoUrl);
    body.innerHTML = vid
      ? '<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/' + vid + '" frameborder="0" allowfullscreen></iframe></div><h2>' + vc.title + '</h2><p>' + (vc.description || '') + '</p>'
      : '<p>Video no disponible</p>';
    this.openModal('videocast-modal');
  }

  extractYouTubeId(url) {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  // ==================== VIDEOS ====================

  async loadVideosRanking() {
    const dm = getDataManager();
    const result = await dm.loadVideos();
    const container = document.getElementById('videos-ranking');
    if (!container) return;
    const videos = result.data || result || [];
    if (!videos.length) { this.toggleSection('videos-ranking', false); return; }
    this.toggleSection('videos-ranking', true);
    container.innerHTML = videos.sort((a, b) => (a.order || 0) - (b.order || 0)).map(v =>
      '<div class="vid-item" data-url="' + v.videoUrl + '">' +
        '<span class="vid-rank">' + (v.order || '—') + '</span>' +
        '<div class="vid-info"><strong>' + v.name + '</strong>' + (v.description ? '<p>' + v.description + '</p>' : '') + '</div>' +
        '<i class="fas fa-play vid-icon"></i></div>'
    ).join('');
  }

  // ==================== ENCUESTAS ====================

  async loadPolls() {
    const dm = getDataManager();
    const polls = await dm.loadPolls();
    if (!polls || !polls.length) { this.toggleSection('polls-container', false); return; }
    this.toggleSection('polls-container', true);
    const container = document.getElementById('polls-container');
    if (!container) return;
    container.innerHTML = polls.filter(p => p.active).map(poll =>
      '<div class="poll-card" data-id="' + poll.id + '">' +
        '<h3 class="poll-q">' + (poll.question || poll.title || poll.name || '') + '</h3>' +
        '<div class="poll-opts">' +
        (poll.options || []).map(opt =>
          '<button class="poll-opt" data-poll-id="' + poll.id + '" data-option-id="' + opt.id + '">' +
            '<span class="poll-opt-label">' + (opt.text || '') + '</span>' +
            '<span class="poll-opt-bar" style="width:0%"></span>' +
            '<span class="poll-opt-count">' + (opt.votes || 0) + '</span></button>'
        ).join('') +
        '</div>' +
        '<p class="poll-voted" style="display:none"><i class="fas fa-check"></i> Gracias por votar</p></div>'
    ).join('');
  }

  async handleVote(pollId, optionId) {
    const dm = getDataManager();
    try {
      await dm.votePoll(pollId, optionId);
      const polls = await dm.loadPolls(true);
      const poll = (polls || []).find(p => p.id === pollId);
      if (!poll) return;
      const total = (poll.options || []).reduce((s, o) => s + (o.votes || 0), 0);
      const card = document.querySelector('.poll-card[data-id="' + pollId + '"]');
      if (!card) return;
      card.querySelectorAll('.poll-opt').forEach((btn, i) => {
        const opt = (poll.options || [])[i];
        if (!opt) return;
        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
        btn.querySelector('.poll-opt-bar').style.width = pct + '%';
        btn.querySelector('.poll-opt-count').textContent = opt.votes + ' (' + pct + '%)';
        btn.disabled = true;
      });
      const msg = card.querySelector('.poll-voted');
      if (msg) msg.style.display = 'flex';
    } catch (error) { console.error('TradicionalTemplate: vote error:', error); }
  }

  // ==================== EVENTOS ====================

  async loadEventsTimeline() {
    const dm = getDataManager();
    const events = await dm.loadEvents();
    if (!events || !events.length) { this.toggleSection('events-timeline', false); return; }
    this.toggleSection('events-timeline', true);
    const container = document.getElementById('events-timeline');
    if (!container) return;
    const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    container.innerHTML = sorted.map(e => {
      const d = new Date(e.date);
      return '<div class="event-card">' +
        '<div class="event-date"><span class="event-day">' + d.getDate() + '</span><span class="event-month">' + d.toLocaleDateString('es-ES', { month: 'short' }) + '</span></div>' +
        '<div class="event-body">' +
          '<h3>' + e.name + '</h3>' +
          '<p>' + (e.description || '') + '</p>' +
          '<small>' + (e.time || '') + (e.location ? ' · ' + e.location : '') + '</small>' +
        '</div></div>';
    }).join('');
  }

  // ==================== SPONSORS ====================

  async loadSponsors() {
    const dm = getDataManager();
    const sponsors = await dm.loadSponsors();
    if (!sponsors || !sponsors.length) { this.toggleSection('sponsors-grid', false); return; }
    this.toggleSection('sponsors-grid', true);
    const grid = document.getElementById('sponsors-grid');
    if (!grid) return;
    grid.innerHTML = sponsors.map(s =>
      '<div class="sponsor-card"><h3>' + s.name + '</h3><p>' + (s.description || '') + '</p></div>'
    ).join('');
  }

  // ==================== LOCUTORES ====================

  async loadAnnouncersGrid() {
    const dm = getDataManager();
    const announcers = await dm.loadAnnouncers();
    if (!announcers || !announcers.length) { this.toggleSection('announcers-grid', false); return; }
    this.toggleSection('announcers-grid', true);
    const container = document.getElementById('announcers-grid');
    if (!container) return;
    container.innerHTML = announcers.map(a =>
      '<div class="ann-card"><div class="ann-name">' + a.name + '</div><p>' + (a.biography || '') + '</p></div>'
    ).join('');
  }

  // ==================== GALERÍAS ====================

  async loadGalleriesList() {
    const dm = getDataManager();
    const galleries = await dm.loadGalleries();
    if (!galleries || !galleries.length) { this.toggleSection('galleries-list', false); return; }
    this.toggleSection('galleries-list', true);
    const container = document.getElementById('galleries-list');
    if (!container) return;
    for (const g of galleries) {
      if (g.imageUrl) g.imageUrl = await dm.getImageUrl(g.imageUrl);
    }
    container.innerHTML = galleries.map(g => '<div class="gal-card" data-id="' + g.id + '">' +
      (g.imageUrl ? '<img src="' + g.imageUrl + '" alt="' + g.name + '" loading="lazy">' : '') +
      '<div class="gal-body"><h3>' + g.name + '</h3><small>' + (g.images || []).length + ' imágenes</small></div></div>'
    ).join('');
  }

  async openGallery(id) {
    const dm = getDataManager();
    const gals = await dm.loadGalleries();
    const gal = (gals || []).find(g => g.id === id);
    if (!gal) return;
    const body = document.getElementById('gallery-modal-body');
    const thumbs = document.getElementById('gallery-thumbnails');
    if (body) {
      body.innerHTML = gal.images && gal.images.length
        ? '<img src="' + dm.getImageUrl(gal.images[0].imageUrl) + '" class="gallery-main">'
        : '<p>Sin imágenes</p>';
    }
    if (thumbs && gal.images) {
      thumbs.innerHTML = gal.images.sort((a, b) => (a.order || 0) - (b.order || 0)).map(img =>
        '<img src="' + dm.getImageUrl(img.imageUrl) + '" class="gallery-thumb" data-url="' + dm.getImageUrl(img.imageUrl) + '">'
      ).join('');
    }
    this.openModal('gallery-modal');
  }

  // ==================== ÚLTIMOS TEMAS ====================

  async loadRecentTracks() {
    try {
      const dm = getDataManager();
      const song = await dm.loadCurrentSong();
      if (!song || !song.history) { this.toggleSection('recent-tracks', false); return; }
      this.toggleSection('recent-tracks', true);
      const container = document.getElementById('recent-tracks');
      if (!container) return;
      container.innerHTML = song.history.map(t =>
        '<div class="track-item">' + t.replace(/<br\s*\/?>/g, '') + '</div>'
      ).join('');
    } catch (e) {}
  }

  // ==================== NOSOTROS ====================

  async populateAbout() {
    const t = document.getElementById('about-title');
    const d = document.getElementById('about-desc');
    const h = document.getElementById('about-desc-hero');
    if (!t && !d) return;
    try {
      const dm = getDataManager();
      const data = await dm.loadBasicData();
      if (t) t.textContent = data.projectName || data.name || 'Nuestra Radio';
      const desc = data.projectDescription || data.description || '';
      if (d) d.textContent = desc;
      if (h) h.textContent = desc;
    } catch (e) {}
  }

  // ==================== LOAD MORE ====================

  setupLoadMore() {
    const els = [
      ['news-load-more', () => this.loadMoreNews()],
      ['news-load-more-full', () => this.loadMoreNews()],
      ['podcasts-load-more', () => this.loadMorePodcasts()],
      ['videocasts-load-more', () => this.loadMoreVideocasts()]
    ];
    els.forEach(([id, fn]) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    });
  }

  // ==================== CAROUSELES ====================

  setupCarousels() {}

  // ==================== MODALES ====================

  setupModalHandlers() {
    document.querySelectorAll('.modal').forEach(modal => {
      const close = modal.querySelector('.modal-close');
      if (close) close.addEventListener('click', () => this.closeModal(modal.id));
      modal.addEventListener('click', (e) => { if (e.target === modal) this.closeModal(modal.id); });
    });
    document.addEventListener('click', (e) => {
      const slug = e.target.closest('[data-slug]');
      if (slug) { e.preventDefault(); this.loadNewsDetail(slug.dataset.slug); return; }
      const pc = e.target.closest('.pod-card[data-id]');
      if (pc) { this.loadPodcastDetail(pc.dataset.id); return; }
      const vc = e.target.closest('.vc-card[data-id]');
      if (vc) { this.loadVideocastDetail(vc.dataset.id); return; }
      const vi = e.target.closest('.vid-item[data-url]');
      if (vi) {
        e.preventDefault();
        const vid = this.extractYouTubeId(vi.dataset.url);
        if (vid) {
          const b = document.getElementById('video-modal-body');
          if (b) b.innerHTML = '<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/' + vid + '" frameborder="0" allowfullscreen></iframe></div>';
          this.openModal('video-modal');
        }
        return;
      }
      const gc = e.target.closest('.gal-card[data-id]');
      if (gc) { this.openGallery(gc.dataset.id); return; }
      const gt = e.target.closest('.gallery-thumb');
      if (gt) { const m = document.querySelector('.gallery-main'); if (m) m.src = gt.dataset.url; return; }
      const po = e.target.closest('.poll-opt');
      if (po && !po.disabled) { this.handleVote(po.dataset.pollId, po.dataset.optionId); return; }
    });
  }

  // ==================== CONTACTO ====================

  setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('.btn-submit');
      const fb = document.getElementById('contact-feedback');
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const subject = document.getElementById('contact-subject').value.trim();
      const message = document.getElementById('contact-message').value.trim();
      btn.disabled = true; btn.textContent = 'Enviando...';
      try {
        const resp = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, subject, message })
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok && data.success) {
          if (fb) { fb.className = 'contact-feedback success'; fb.textContent = data.message || 'Gracias por tu mensaje. Te responderemos pronto.'; fb.style.display = 'block'; }
          form.reset();
        } else {
          throw new Error(data.message || 'Error al enviar el mensaje');
        }
      } catch (err) {
        if (fb) { fb.className = 'contact-feedback error'; fb.textContent = err.message || 'Error al enviar el mensaje. Intenta de nuevo.'; fb.style.display = 'block'; }
      } finally { btn.disabled = false; btn.textContent = 'Enviar mensaje'; }
    });
  }

  // ==================== UTILIDADES ====================

  toggleSection(containerId, hasData) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const tab = container.closest('.tab-content');
    if (tab) tab.style.display = hasData ? '' : 'none';
    const tabName = this._tabMap[containerId];
    if (tabName) {
      const item = document.querySelector('.topnav-item[data-tab="' + tabName + '"]');
      if (item) item.style.display = hasData ? '' : 'none';
    }
  }

  openModal(id) {
    const m = document.getElementById(id);
    if (m) { m.style.display = 'flex'; setTimeout(() => m.classList.add('active'), 10); }
  }

  closeModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('active'); setTimeout(() => { m.style.display = 'none'; }, 200); }
    const a = document.getElementById('podcast-audio');
    if (a && !a.paused) a.pause();
  }

  _setHeroCover(url) {
    const img = document.getElementById('track-artwork');
    const def = document.getElementById('default-artwork');
    const heroImg = document.getElementById('hero-track-artwork');
    const heroDef = document.getElementById('hero-cover-default');
    if (img) { img.src = url; img.style.display = 'block'; if (def) def.style.display = 'none'; }
    if (heroImg) { heroImg.src = url; heroImg.style.display = 'block'; if (heroDef) heroDef.style.display = 'none'; }
  }

  _showHeroDefault() {
    const img = document.getElementById('track-artwork');
    const def = document.getElementById('default-artwork');
    const heroImg = document.getElementById('hero-track-artwork');
    const heroDef = document.getElementById('hero-cover-default');
    if (img) img.style.display = 'none';
    if (def) def.style.display = 'flex';
    if (heroImg) heroImg.style.display = 'none';
    if (heroDef) heroDef.style.display = 'flex';
  }

  onCurrentSongLoaded(songData) {
    const art = songData.art || '';
    const title = songData.title || '';
    const artist = songData.artist || songData.djUsername || 'En Vivo';

    const img = document.getElementById('track-artwork');
    const heroImg = document.getElementById('hero-track-artwork');
    const heroTitle = document.getElementById('hero-track-title');
    const heroArtist = document.getElementById('hero-track-artist');
    const statusEl = document.getElementById('hero-status');

    if (heroTitle) heroTitle.textContent = title || 'Radio';
    if (heroArtist) heroArtist.textContent = artist;

    if (statusEl) {
      statusEl.innerHTML = title
        ? '<span class="status-dot"></span><span>EN VIVO</span>'
        : '<span class="status-dot"></span><span>OFFLINE</span>';
    }

    if (art && art !== img?.src) {
      const i = new Image();
      i.onload = () => this._setHeroCover(art);
      i.onerror = () => {
        if (this._radioCoverUrl) this._setHeroCover(this._radioCoverUrl);
        else this._showHeroDefault();
      };
      i.src = art;
    } else if (!art) {
      if (this._radioCoverUrl && img?.src !== this._radioCoverUrl) {
        this._setHeroCover(this._radioCoverUrl);
      } else if (!this._radioCoverUrl) {
        this._showHeroDefault();
      }
    }
  }

  onAudioPlay() {
    super.onAudioPlay();
    const s = document.getElementById('hero-status');
    if (s) s.innerHTML = '<span class="status-dot"></span><span>EN VIVO</span>';
  }

  onAudioPause() {
    super.onAudioPause();
    const s = document.getElementById('hero-status');
    if (s) s.innerHTML = '<span class="status-dot"></span><span>PAUSA</span>';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.tradicionalTemplate = new TradicionalTemplate();
    await window.tradicionalTemplate.init();
  } catch (error) {
    console.error('TradicionalTemplate: error creating instance:', error);
  }
});

window.addEventListener('beforeunload', () => {
  if (window.tradicionalTemplate) window.tradicionalTemplate.destroy();
});

export default TradicionalTemplate;
