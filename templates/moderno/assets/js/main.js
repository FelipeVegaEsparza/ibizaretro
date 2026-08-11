import TemplateBase from '/assets/js/template-base.js';
import { getDataManager } from '/assets/js/data-manager.js';

class ModernoTemplate extends TemplateBase {
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

    this.sponsorsSwiper = null;
    this.currentPage = { news: 1, podcasts: 1, videocasts: 1 };
    this._hasMore = { news: true, podcasts: true, videocasts: true };
    this._loadingMore = { news: false, podcasts: false, videocasts: false };
    this._programDayMap = {};
    this._selectedDay = 'Lunes';
    this._tvMode = 'radio';
    this.videoStreamUrl = null;

    this._tabNavMap = {
      'featured-news-grid': 'news',
      'all-news-grid': 'news',
      'programs-timeline': 'programs',
      'programs-grid': 'programs',
      'podcasts-list': 'podcasts',
      'videocasts-list': 'videocasts',
      'videos-ranking': 'videos',
      'polls-container': 'polls',
      'events-timeline': 'events',
      'sponsors-carousel': 'sponsors',
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
      console.log('ModernoTemplate: initialized');
    } catch (error) {
      console.error('ModernoTemplate: init error:', error);
    }
  }

  onBasicDataLoaded(data) {
    if (this._radioCoverUrl) {
      const coverImg = document.getElementById('track-artwork');
      const coverDefault = document.getElementById('default-artwork');
      const heroBg = document.getElementById('hero-bg');
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

  async checkTV() {
    try {
      const dm = getDataManager();
      this.videoStreamUrl = await dm.loadVideoStreamUrl();
      const btn = document.getElementById('hero-tv-btn');
      if (btn && this.videoStreamUrl) btn.style.display = 'inline-flex';
    } catch (e) {
      this._tvMode = 'radio';
    }
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

  // ==================== TABS ====================

  setupTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const moreBtn = document.getElementById('nav-more');
    const overflow = document.getElementById('nav-overflow');
    const overflowContent = document.getElementById('nav-overflow-content');

    const switchTab = (tabName, activeItem) => {
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      const tab = document.getElementById('tab-' + tabName);
      if (tab) tab.classList.add('active');
      if (activeItem) activeItem.classList.add('active');
      if (overflow) overflow.style.display = 'none';
      document.querySelector('.main')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        switchTab(item.dataset.tab, item);
      });
    });

    this.updateNavOverflow();

    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        overflow.style.display = overflow.style.display !== 'none' ? 'none' : 'block';
      });
    }

    document.addEventListener('click', (e) => {
      if (overflow && overflow.style.display !== 'none') {
        if (!e.target.closest('#nav-overflow') && !e.target.closest('#nav-more')) {
          overflow.style.display = 'none';
        }
      }
    });

    if (overflowContent) {
      overflowContent.addEventListener('click', (e) => {
        const item = e.target.closest('.nav-item');
        if (item) {
          switchTab(item.dataset.tab, item);
        }
      });
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.updateNavOverflow(), 200);
    });
  }

  updateNavOverflow() {
    const nav = document.getElementById('bottom-nav');
    const moreBtn = document.getElementById('nav-more');
    const overflowContent = document.getElementById('nav-overflow-content');
    if (!nav || !moreBtn || !overflowContent) return;

    const visibleItems = Array.from(nav.querySelectorAll('.nav-item')).filter(
      item => item.style.display !== 'none'
    );
    const navW = nav.clientWidth;
    const moreW = 50;
    let totalW = 0;
    let overflow = [];

    visibleItems.forEach(item => {
      const w = item.offsetWidth || 50;
      if (totalW + w + moreW <= navW) {
        totalW += w;
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
        clone.addEventListener('click', () => {
          document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
          const tab = document.getElementById('tab-' + item.dataset.tab);
          if (tab) tab.classList.add('active');
          item.classList.add('active');
          document.getElementById('nav-overflow').style.display = 'none';
          document.querySelector('.main')?.scrollTo({ top: 0, behavior: 'smooth' });
        });
        overflowContent.appendChild(clone);
      });
    } else {
      moreBtn.style.display = 'none';
      overflowContent.innerHTML = '';
    }
  }

  // ==================== NOTICIAS ====================

  async loadAllNews() {
    const dm = getDataManager();
    const result = await dm.loadNews(this.currentPage.news, 6);
    if (!result.data || !result.data.length) {
      this.toggleSection('all-news-grid', false);
      this.toggleSection('featured-news-grid', false);
      return;
    }
    this.toggleSection('all-news-grid', true);
    for (const item of result.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    const featured = result.data.slice(0, 3);
    const fContainer = document.getElementById('featured-news-grid');
    if (fContainer && featured.length) {
      fContainer.innerHTML = featured.map((item, i) => `
        <article class="news-featured-card" data-slug="${item.slug}" style="--i:${i}">
          <div class="nfc-bg" style="background-image:url('${item.imageUrl || ''}')"></div>
          <div class="nfc-overlay"></div>
          <div class="nfc-content">
            <span class="nfc-badge">NOTICIA</span>
            <h3>${item.name}</h3>
            <p>${item.shortText || ''}</p>
            <time>${new Date(item.createdAt).toLocaleDateString('es-ES')}</time>
          </div>
        </article>
      `).join('');
    }
    const container = document.getElementById('all-news-grid');
    if (!container) return;
    container.innerHTML = result.data.map(item => `
      <article class="news-card" data-slug="${item.slug}">
        <div class="news-card-img">
          <img src="${item.imageUrl || ''}" alt="${item.name}" loading="lazy">
        </div>
        <div class="news-card-body">
          <h3>${item.name}</h3>
          <p>${item.shortText || ''}</p>
          <time>${new Date(item.createdAt).toLocaleDateString('es-ES')}</time>
        </div>
      </article>
    `).join('');
    this._hasMore.news = result.pagination?.hasMore ?? false;
    const moreBtn = document.getElementById('news-more');
    if (moreBtn) moreBtn.style.display = this._hasMore.news ? 'flex' : 'none';
  }

  async loadMoreNews() {
    if (this._loadingMore.news || !this._hasMore.news) return;
    this._loadingMore.news = true;
    this.currentPage.news++;
    const dm = getDataManager();
    const result = await dm.loadNews(this.currentPage.news, 6);
    if (!result.data || !result.data.length) {
      this._hasMore.news = false;
      const moreBtn = document.getElementById('news-more');
      if (moreBtn) moreBtn.style.display = 'none';
      this._loadingMore.news = false;
      return;
    }
    for (const item of result.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    const container = document.getElementById('all-news-grid');
    if (container) {
      container.insertAdjacentHTML('beforeend', result.data.map(item => `
        <article class="news-card" data-slug="${item.slug}">
          <div class="news-card-img">
            <img src="${item.imageUrl || ''}" alt="${item.name}" loading="lazy">
          </div>
          <div class="news-card-body">
            <h3>${item.name}</h3>
            <p>${item.shortText || ''}</p>
            <time>${new Date(item.createdAt).toLocaleDateString('es-ES')}</time>
          </div>
        </article>
      `).join(''));
    }
    this._hasMore.news = result.pagination?.hasMore ?? false;
    const moreBtn = document.getElementById('news-more');
    if (moreBtn) moreBtn.style.display = this._hasMore.news ? 'flex' : 'none';
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

  // ==================== PROGRAMACIÓN ====================

  async loadPrograms() {
    const dm = getDataManager();
    const programs = await dm.loadPrograms();
    if (!programs || !programs.length) {
      this.toggleSection('programs-timeline', false);
      this.toggleSection('programs-grid', false);
      return;
    }
    this.toggleSection('programs-timeline', true);
    this.toggleSection('programs-grid', true);
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
    this.renderProgramsTimeline();
    this.renderProgramsGrid();
    this.setupDayNav();
  }

  renderProgramsTimeline() {
    const container = document.getElementById('programs-timeline');
    if (!container) return;
    const dayPrograms = (this._programDayMap[this._selectedDay] || [])
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    if (!dayPrograms.length) {
      container.innerHTML = '<p class="empty-msg">Sin programación este día</p>';
      return;
    }
    container.innerHTML = dayPrograms.map(p => '<div class="prog-item">' +
      '<div class="prog-time">' +
        '<span class="prog-start">' + (p.startTime || '') + '</span>' +
        (p.endTime ? '<span class="prog-end">' + p.endTime + '</span>' : '') +
      '</div>' +
      '<div class="prog-line"></div>' +
      '<div class="prog-info">' +
        '<strong class="prog-name">' + p.name + '</strong>' +
        (p.host ? '<span class="prog-host"><i class="fas fa-user"></i> ' + p.host + '</span>' : '') +
      '</div></div>'
    ).join('');
  }

  renderProgramsGrid() {
    const container = document.getElementById('programs-grid');
    if (!container) return;
    const daysOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    container.innerHTML = daysOrder.map(day => {
      const progs = (this._programDayMap[day] || []).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
      return '<div class="prog-day' + (day === this._selectedDay ? ' active' : '') + '">' +
        '<h4 class="prog-day-title">' + day + '</h4>' +
        (progs.length ? progs.map(p => '<div class="prog-day-item">' +
          '<span class="prog-day-time">' + (p.startTime || '') + (p.endTime ? ' - ' + p.endTime : '') + '</span>' +
          '<span class="prog-day-name">' + p.name + '</span></div>'
        ).join('') : '<span class="prog-day-empty">—</span>') +
      '</div>';
    }).join('');
  }

  setupDayNav() {
    const nav = document.getElementById('day-nav');
    if (!nav) return;
    nav.querySelectorAll('.day-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dayNames = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
          jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };
        const dayName = dayNames[btn.dataset.day];
        if (!dayName || dayName === this._selectedDay) return;
        this._selectedDay = dayName;
        nav.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderProgramsTimeline();
      });
    });
    const dayKeys = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
      jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };
    const activeKey = Object.keys(dayKeys).find(k => dayKeys[k] === this._selectedDay);
    const activeBtn = nav.querySelector('[data-day="' + activeKey + '"]');
    if (activeBtn) activeBtn.classList.add('active');
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
      '<div class="pod-thumb">' +
        '<img src="' + (p.imageUrl || '') + '" alt="' + p.title + '" loading="lazy">' +
        '<div class="pod-play"><i class="fas fa-play"></i></div>' +
        (p.duration ? '<span class="pod-duration">' + p.duration + '</span>' : '') +
      '</div>' +
      '<div class="pod-body">' +
        '<h3>' + p.title + '</h3>' +
        '<small>' + new Date(p.createdAt).toLocaleDateString('es-ES') + '</small>' +
      '</div></div>'
    ).join('');
    this._hasMore.podcasts = result.pagination?.hasMore ?? false;
    const moreBtn = document.getElementById('podcasts-more');
    if (moreBtn) moreBtn.style.display = this._hasMore.podcasts ? 'flex' : 'none';
  }

  async loadMorePodcasts() {
    if (this._loadingMore.podcasts || !this._hasMore.podcasts) return;
    this._loadingMore.podcasts = true;
    this.currentPage.podcasts++;
    const dm = getDataManager();
    const result = await dm.loadPodcasts(this.currentPage.podcasts, 8);
    if (!result.data || !result.data.length) {
      this._hasMore.podcasts = false;
      const moreBtn = document.getElementById('podcasts-more');
      if (moreBtn) moreBtn.style.display = 'none';
      this._loadingMore.podcasts = false;
      return;
    }
    for (const item of result.data) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    const container = document.getElementById('podcasts-list');
    if (container) {
      container.insertAdjacentHTML('beforeend', result.data.map(p => '<div class="pod-card" data-id="' + p.id + '">' +
        '<div class="pod-thumb">' +
          '<img src="' + (p.imageUrl || '') + '" alt="' + p.title + '" loading="lazy">' +
          '<div class="pod-play"><i class="fas fa-play"></i></div>' +
          (p.duration ? '<span class="pod-duration">' + p.duration + '</span>' : '') +
        '</div>' +
        '<div class="pod-body">' +
          '<h3>' + p.title + '</h3>' +
          '<small>' + new Date(p.createdAt).toLocaleDateString('es-ES') + '</small>' +
        '</div></div>'
      ).join(''));
    }
    this._hasMore.podcasts = result.pagination?.hasMore ?? false;
    const moreBtn = document.getElementById('podcasts-more');
    if (moreBtn) moreBtn.style.display = this._hasMore.podcasts ? 'flex' : 'none';
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
    if (audio) {
      audio.src = podcast.audioUrl || podcast.fileUrl || podcast.url || '';
      audio.load();
    }
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
      '<div class="vc-thumb" style="background-image:url(\'' + (v.imageUrl || '') + '\')">' +
        '<div class="vc-play"><i class="fas fa-play"></i></div>' +
        (v.duration ? '<span class="vc-duration">' + v.duration + '</span>' : '') +
      '</div>' +
      '<div class="vc-body"><h3>' + v.title + '</h3></div></div>'
    ).join('');
    this._hasMore.videocasts = result.pagination?.hasMore ?? false;
    const moreBtn = document.getElementById('videocasts-more');
    if (moreBtn) moreBtn.style.display = this._hasMore.videocasts ? 'flex' : 'none';
  }

  async loadMoreVideocasts() {
    if (this._loadingMore.videocasts || !this._hasMore.videocasts) return;
    this._loadingMore.videocasts = true;
    this.currentPage.videocasts++;
    const dm = getDataManager();
    const result = await dm.loadVideocasts(this.currentPage.videocasts, 8);
    if (!result.data || !result.data.length) {
      this._hasMore.videocasts = false;
      const moreBtn = document.getElementById('videocasts-more');
      if (moreBtn) moreBtn.style.display = 'none';
      this._loadingMore.videocasts = false;
      return;
    }
    const container = document.getElementById('videocasts-list');
    if (container) {
      container.insertAdjacentHTML('beforeend', result.data.map(v => '<div class="vc-card" data-id="' + v.id + '">' +
        '<div class="vc-thumb" style="background-image:url(\'' + (v.imageUrl || '') + '\')">' +
          '<div class="vc-play"><i class="fas fa-play"></i></div>' +
          (v.duration ? '<span class="vc-duration">' + v.duration + '</span>' : '') +
        '</div>' +
        '<div class="vc-body"><h3>' + v.title + '</h3></div></div>'
      ).join(''));
    }
    this._hasMore.videocasts = result.pagination?.hasMore ?? false;
    const moreBtn = document.getElementById('videocasts-more');
    if (moreBtn) moreBtn.style.display = this._hasMore.videocasts ? 'flex' : 'none';
    this._loadingMore.videocasts = false;
  }

  async loadVideocastDetail(id) {
    const dm = getDataManager();
    const vc = await dm.loadVideocastById(id);
    if (!vc) return;
    const body = document.getElementById('videocast-modal-body');
    if (!body) return;
    const videoId = this.extractYouTubeId(vc.videoUrl);
    body.innerHTML = videoId
      ? '<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/' + videoId + '" frameborder="0" allowfullscreen></iframe></div><h2>' + vc.title + '</h2><p>' + (vc.description || '') + '</p>'
      : '<p>Video no disponible</p>';
    this.openModal('videocast-modal');
  }

  extractYouTubeId(url) {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  // ==================== VIDEOS RANKING ====================

  async loadVideosRanking() {
    const dm = getDataManager();
    const result = await dm.loadVideos();
    const container = document.getElementById('videos-ranking');
    if (!container) return;
    const videos = result.data || result || [];
    if (!videos.length) {
      this.toggleSection('videos-ranking', false);
      return;
    }
    this.toggleSection('videos-ranking', true);
    container.innerHTML = videos.sort((a, b) => (a.order || 0) - (b.order || 0)).map(v =>
      '<div class="video-item" data-url="' + v.videoUrl + '">' +
        '<span class="video-rank">' + (v.order || '—') + '</span>' +
        '<div class="video-info">' +
          '<strong>' + v.name + '</strong>' +
          (v.description ? '<p>' + v.description + '</p>' : '') +
        '</div>' +
        '<i class="fas fa-play video-play-icon"></i>' +
      '</div>'
    ).join('');
  }

  // ==================== ENCUESTAS ====================

  async loadPolls() {
    const dm = getDataManager();
    const polls = await dm.loadPolls();
    if (!polls || !polls.length) {
      this.toggleSection('polls-container', false);
      return;
    }
    this.toggleSection('polls-container', true);
    const container = document.getElementById('polls-container');
    if (!container) return;
    container.innerHTML = polls.filter(p => p.active).map(poll => {
      const q = poll.question || poll.title || poll.name || '';
      return '<div class="poll-card" data-id="' + poll.id + '">' +
        '<h3 class="poll-q">' + q + '</h3>' +
        '<div class="poll-opts">' +
        (poll.options || []).map(opt =>
          '<button class="poll-opt" data-poll-id="' + poll.id + '" data-option-id="' + opt.id + '">' +
            '<span class="poll-opt-label">' + (opt.text || '') + '</span>' +
            '<span class="poll-opt-bar" style="width:0%"></span>' +
            '<span class="poll-opt-count">' + (opt.votes || 0) + '</span>' +
          '</button>'
        ).join('') +
        '</div>' +
        '<p class="poll-voted" style="display:none"><i class="fas fa-check"></i> Gracias por votar</p>' +
      '</div>';
    }).join('');
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
    } catch (error) {
      console.error('ModernoTemplate: vote error:', error);
    }
  }

  // ==================== EVENTOS ====================

  async loadEventsTimeline() {
    const dm = getDataManager();
    const events = await dm.loadEvents();
    if (!events || !events.length) {
      this.toggleSection('events-timeline', false);
      return;
    }
    this.toggleSection('events-timeline', true);
    const container = document.getElementById('events-timeline');
    if (!container) return;
    const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    container.innerHTML = sorted.map(e => {
      const d = new Date(e.date);
      return '<div class="event-item">' +
        '<div class="event-date">' +
          '<span class="event-day">' + d.getDate() + '</span>' +
          '<span class="event-month">' + d.toLocaleDateString('es-ES', { month: 'short' }) + '</span>' +
        '</div>' +
        '<div class="event-info">' +
          '<h3>' + e.name + '</h3>' +
          '<p>' + (e.description || '') + '</p>' +
          '<small>' + (e.time || '') + (e.location ? ' · ' + e.location : '') + '</small>' +
        '</div></div>';
    }).join('');
  }

  // ==================== AUSPICIADORES ====================

  async loadSponsors() {
    const dm = getDataManager();
    const sponsors = await dm.loadSponsors();
    if (!sponsors || !sponsors.length) {
      this.toggleSection('sponsors-carousel', false);
      this.toggleSection('sponsors-grid', false);
      return;
    }
    this.toggleSection('sponsors-carousel', true);
    this.toggleSection('sponsors-grid', true);
    for (const s of sponsors) {
      if (s.logoUrl) s.logoUrl = await dm.getImageUrl(s.logoUrl);
    }
    const carousel = document.getElementById('sponsors-carousel-wrapper');
    if (carousel) {
      carousel.innerHTML = sponsors.map(s =>
        '<div class="swiper-slide"><a href="' + (s.website || '#') + '" target="_blank" rel="noopener"><img src="' + s.logoUrl + '" alt="' + s.name + '" title="' + s.name + '"></a></div>'
      ).join('');
    }
    const grid = document.getElementById('sponsors-grid');
    if (grid) {
      grid.innerHTML = sponsors.map(s =>
        '<div class="sponsor-card"><img src="' + s.logoUrl + '" alt="' + s.name + '" loading="lazy"><h3>' + s.name + '</h3><p>' + (s.description || '') + '</p></div>'
      ).join('');
    }
  }

  // ==================== LOCUTORES ====================

  async loadAnnouncersGrid() {
    const dm = getDataManager();
    const announcers = await dm.loadAnnouncers();
    if (!announcers || !announcers.length) {
      this.toggleSection('announcers-grid', false);
      return;
    }
    this.toggleSection('announcers-grid', true);
    for (const a of announcers) {
      if (a.photoUrl) a.photoUrl = await dm.getImageUrl(a.photoUrl);
    }
    const container = document.getElementById('announcers-grid');
    if (!container) return;
    container.innerHTML = announcers.map(a =>
      '<div class="ann-card">' +
        '<div class="ann-photo"><img src="' + (a.photoUrl || '') + '" alt="' + a.name + '" loading="lazy"></div>' +
        '<div class="ann-name">' + a.name + '</div>' +
        '<p>' + (a.biography || '') + '</p></div>'
    ).join('');
  }

  // ==================== GALERÍAS ====================

  async loadGalleriesList() {
    const dm = getDataManager();
    const galleries = await dm.loadGalleries();
    if (!galleries || !galleries.length) {
      this.toggleSection('galleries-list', false);
      return;
    }
    this.toggleSection('galleries-list', true);
    for (const g of galleries) {
      if (g.imageUrl) g.imageUrl = await dm.getImageUrl(g.imageUrl);
    }
    const container = document.getElementById('galleries-list');
    if (!container) return;
    container.innerHTML = galleries.map(g =>
      '<div class="gal-card" data-id="' + g.id + '">' +
        (g.imageUrl ? '<img src="' + g.imageUrl + '" alt="' + g.name + '" loading="lazy">' : '') +
        '<div class="gal-body"><h3>' + g.name + '</h3><small>' + (g.images || []).length + ' imágenes</small></div></div>'
    ).join('');
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
        ? '<img src="' + dm.getImageUrl(gallery.images[0].imageUrl) + '" class="gallery-main">'
        : '<p>Sin imágenes</p>';
    }
    if (thumbs && gallery.images) {
      thumbs.innerHTML = gallery.images.sort((a, b) => (a.order || 0) - (b.order || 0)).map(img =>
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
      if (!song || !song.history) {
        this.toggleSection('recent-tracks', false);
        return;
      }
      this.toggleSection('recent-tracks', true);
      const container = document.getElementById('recent-tracks');
      if (!container) return;
      container.innerHTML = song.history.map(track =>
        '<div class="track-item">' + track.replace(/<br\s*\/?>/g, '') + '</div>'
      ).join('');
    } catch (e) {}
  }

  // ==================== NOSOTROS ====================

  async populateAbout() {
    const titleEl = document.getElementById('about-title');
    const descEl = document.getElementById('about-desc');
    if (!titleEl && !descEl) return;
    try {
      const dm = getDataManager();
      const data = await dm.loadBasicData();
      if (titleEl) titleEl.textContent = data.projectName || data.name || 'Nuestra Radio';
      if (descEl) descEl.textContent = data.projectDescription || data.description || '';
    } catch (e) {}
  }

  // ==================== LOAD MORE ====================

  setupLoadMore() {
    const newsBtn = document.getElementById('news-load-more');
    if (newsBtn) newsBtn.addEventListener('click', () => this.loadMoreNews());
    const podBtn = document.getElementById('podcasts-load-more');
    if (podBtn) podBtn.addEventListener('click', () => this.loadMorePodcasts());
    const vcBtn = document.getElementById('videocasts-load-more');
    if (vcBtn) vcBtn.addEventListener('click', () => this.loadMoreVideocasts());
  }

  // ==================== CAROUSELES ====================

  setupCarousels() {
    if (typeof Swiper === 'undefined') return;
    setTimeout(() => {
      const sponsorSlides = document.querySelectorAll('#sponsors-carousel-wrapper .swiper-slide');
      if (document.querySelector('.sponsors-carousel') && sponsorSlides.length > 0 && !this.sponsorsSwiper) {
        try {
          this.sponsorsSwiper = new Swiper('.sponsors-carousel', {
            loop: sponsorSlides.length > 1,
            autoplay: { delay: 3000 },
            slidesPerView: 'auto',
            spaceBetween: 20
          });
        } catch (e) {}
      }
    }, 1000);
  }

  // ==================== MODALES ====================

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
      if (slug) { e.preventDefault(); this.loadNewsDetail(slug.dataset.slug); return; }

      const podCard = e.target.closest('.pod-card[data-id]');
      if (podCard) { this.loadPodcastDetail(podCard.dataset.id); return; }

      const vcCard = e.target.closest('.vc-card[data-id]');
      if (vcCard) { this.loadVideocastDetail(vcCard.dataset.id); return; }

      const videoItem = e.target.closest('.video-item[data-url]');
      if (videoItem) {
        e.preventDefault();
        const videoId = this.extractYouTubeId(videoItem.dataset.url);
        if (videoId) {
          const body = document.getElementById('video-modal-body');
          if (body) body.innerHTML = '<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/' + videoId + '" frameborder="0" allowfullscreen></iframe></div>';
          this.openModal('video-modal');
        }
        return;
      }

      const galCard = e.target.closest('.gal-card[data-id]');
      if (galCard) { this.openGallery(galCard.dataset.id); return; }

      const galThumb = e.target.closest('.gallery-thumb');
      if (galThumb) {
        const main = document.querySelector('.gallery-main');
        if (main) main.src = galThumb.dataset.url;
        return;
      }

      const pollOpt = e.target.closest('.poll-opt');
      if (pollOpt && !pollOpt.disabled) { this.handleVote(pollOpt.dataset.pollId, pollOpt.dataset.optionId); return; }
    });
  }

  // ==================== CONTACTO ====================

  setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('.btn-submit');
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
        btn.innerHTML = 'Enviar <i class="fas fa-arrow-right"></i>';
      }
    });
  }

  // ==================== UTILIDADES ====================

  toggleSection(containerId, hasData) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const tab = container.closest('.tab-content');
    if (tab) {
      tab.style.display = hasData ? '' : 'none';
    }
    const tabName = this._tabNavMap[containerId];
    if (tabName) {
      const navItem = document.querySelector('.nav-item[data-tab="' + tabName + '"]');
      if (navItem) navItem.style.display = hasData ? '' : 'none';
    }
  }

  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('active'), 10);
    }
  }

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => { modal.style.display = 'none'; }, 200);
    }
    const audio = document.getElementById('podcast-audio');
    if (audio && !audio.paused) audio.pause();
  }

  _setHeroCover(url) {
    const coverImg = document.getElementById('track-artwork');
    const coverDefault = document.getElementById('default-artwork');
    const heroBg = document.getElementById('hero-bg');
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
    const coverImg = document.getElementById('track-artwork');
    const coverDefault = document.getElementById('default-artwork');
    const heroBg = document.getElementById('hero-bg');
    if (coverImg) coverImg.style.display = 'none';
    if (coverDefault) coverDefault.style.display = 'flex';
    if (heroBg) {
      heroBg.style.backgroundImage = '';
      heroBg.classList.remove('loaded');
    }
  }

  onCurrentSongLoaded(songData) {
    const heroStatus = document.getElementById('hero-status');
    if (heroStatus) heroStatus.textContent = songData.title ? 'EN VIVO' : 'OFFLINE';

    const coverImg = document.getElementById('track-artwork');
    const artUrl = songData.art || '';

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

    const disc = document.getElementById('cover-disc');
    if (disc) {
      if (songData.title) disc.classList.add('spinning');
      else disc.classList.remove('spinning');
    }
  }

  onAudioPlay() {
    super.onAudioPlay();
    const disc = document.getElementById('cover-disc');
    if (disc) disc.classList.add('spinning');
    const heroStatus = document.getElementById('hero-status');
    if (heroStatus) heroStatus.textContent = 'EN VIVO';
  }

  onAudioPause() {
    super.onAudioPause();
    const disc = document.getElementById('cover-disc');
    if (disc) disc.classList.remove('spinning');
    const heroStatus = document.getElementById('hero-status');
    if (heroStatus) heroStatus.textContent = 'PAUSADO';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.modernoTemplate = new ModernoTemplate();
    await window.modernoTemplate.init();
  } catch (error) {
    console.error('ModernoTemplate: error creating instance:', error);
  }
});

window.addEventListener('beforeunload', () => {
  if (window.modernoTemplate) window.modernoTemplate.destroy();
});

export default ModernoTemplate;
