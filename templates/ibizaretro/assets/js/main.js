/**
 * Template IBIZA RETRO — Landing page
 * Consume todas las características de la API pública.
 * Dock: scroll-spy entre secciones; anclas suaves.
 */
import TemplateBase from '/assets/js/template-base.js';
import { getDataManager } from '/assets/js/data-manager.js';

const DAY_ES = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
  thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
};
const DAY_KEYS = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
  jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo'
};

class IbizaRetroTemplate extends TemplateBase {
  constructor() {
    super({
      audioElementId: 'radio-audio',
      playButtonId: 'play-btn',
      volumeSliderId: 'volume-slider',
      defaultVolume: 60,
      socialContainerIds: ['social-links'],
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
    this.videoStreamUrl = null;
    this._tvPlayer = null;

    this.currentPage = { news: 1, podcasts: 1, videocasts: 1 };
    this._hasMore = { news: true, podcasts: true, videocasts: true };
    this._loadingMore = { news: false, podcasts: false, videocasts: false };

    this._programDayMap = {};
    this._selectedDay = 'Lunes';
    this._galleryCache = [];
  }

  async init() {
    await super.init();
    try {
      this.setupScrollSpy();
      this.setupRevealOnScroll();
      this.setupStatCounters();
      this.setupMarqueeLoop();
      this.setupAnchors();
      this.setupModalHandlers();
      this.setupLoadMore();
      this.setupContactForm();
      this.setupHeroBackground();

      await this.checkTV();
      await this.loadAllContent();

      // Refresca el player tras la carga inicial (mismo flujo que loadRecentTracks)
      this.refreshPlayerTrack();

      // Y se mantiene al día cuando el DataManager emita nuevas canciones
      try {
        getDataManager().on('currentSongLoaded', () => this.refreshPlayerTrack());
      } catch (e) {}

      this.setupCarousels();
      this.updateDockOverflow();
      console.log('IbizaRetro landing: listo');
    } catch (error) {
      console.error('IbizaRetro: init error:', error);
    }
  }

  /**
   * Refresca directamente el título/artista del player desde el DataManager.
   * Mismo patrón que loadRecentTracks(): garantiza que el nombre del tema
   * actual se muestre aunque el flujo heredado de TemplateBase no haya
   * actualizado #track-title / #track-artist.
   */
  async refreshPlayerTrack() {
    try {
      const dm = getDataManager();
      const song = await dm.loadCurrentSong();
      const titleEl = document.getElementById('track-title');
      const artistEl = document.getElementById('track-artist');
      if (song && titleEl && song.title) {
        titleEl.textContent = song.title;
        titleEl.setAttribute('data-text', song.title);
      }
      if (song && artistEl) {
        const artist = song.artist && song.artist !== song.title ? song.artist : 'En Vivo';
        artistEl.textContent = artist;
      }
    } catch (e) {
      console.warn('IbizaRetro: no se pudo refrescar el tema del player', e);
    }
  }

  async loadAllContent() {
    await Promise.allSettled([
      this.loadNewsSection(),
      this.loadBreakingNews(),
      this.loadPrograms(),
      this.loadPodcastsList(),
      this.loadVideocastsList(),
      this.loadVideosRanking(),
      this.loadPolls(),
      this.loadEventsTimeline(),
      this.loadSponsors(),
      this.loadAnnouncersGrid(),
      this.loadGalleriesList(),
      this.loadRecentTracks()
    ]);

    this.applyImageFallbacks();
    this.pruneEmptySections();
  }

  /**
   * Después de cargar todo, oculta las secciones que quedaron completamente
   * vacías y reaplica `auto-fit` a las grillas para que las columnas que
   * sí tienen contenido ocupen el ancho completo de su fila. Si una sección
   * entera quedó vacía, se oculta del flujo y también del dock (scroll-spy).
   */
  pruneEmptySections() {
    // 1) Por cada .cols, contar columnas visibles y ajustar el grid.
    document.querySelectorAll('.cols').forEach((cols) => {
      const visible = Array.from(cols.children).filter((c) => !c.classList.contains('is-empty'));
      cols.classList.remove('cols-2', 'cols-3');
      if (visible.length === 1) cols.classList.add('cols-2'); // auto-fit llena mejor con minmax
      if (visible.length >= 2) cols.classList.add(visible.length === 2 ? 'cols-2' : 'cols-3');
    });

    // 2) Decidir para cada contenedor [data-dynamic-content] si tiene
    //    contenido real. Solo cuentan los items inyectados dinámicamente
    //    (las cards que loadX() crea). Los .col-title y otros headers
    //    estáticos NO cuentan, para que no marquemos como "con contenido"
    //    un contenedor cuya API aún no respondió.
    document.querySelectorAll('[data-dynamic-content]').forEach((container) => {
      const meaningful = container.querySelectorAll(
        '.n-lite, .m-card, .p-item, .e-lite, .s-card, .r-item, .a-card, .g-card, .track-item, .t-item, .poll-card, .sponsors-swiper .swiper-slide:not(.swiper-slide-duplicate)'
      );
      const hasMeaningful = Array.from(meaningful).some((el) => {
        if (el.classList.contains('is-empty')) return false;
        if (el.classList.contains('ph')) return false;
        return true;
      });
      if (hasMeaningful) {
        container.classList.add('has-content');
        container.classList.remove('is-empty');
      } else {
        container.classList.add('is-empty');
      }
    });

    // 3) Ocultar secciones que no tengan ninguna col/block visible.
    const sectionMap = {
      'hero':          null, // hero nunca se oculta
      'historia':      null,
      'generos':       null,
      'himnos':        null, // himnos es contenido estático, no depende de API
      'djs':           null,
      'features':      null,
      'programacion':  '.prog-block:not(.is-empty), .cta-card',
      'noticias':      '.cols > .col:not(.is-empty)',
      'extras':        '.cols > .col:not(.is-empty)',
      'comunidad':     '.block:not(.is-empty), .cols > .col:not(.is-empty)',
      'contacto':      null
    };

    const emptySections = new Set();
    document.querySelectorAll('main .section').forEach((sec) => {
      const id = sec.id;
      if (!id || !sectionMap.hasOwnProperty(id)) return;
      const sel = sectionMap[id];
      if (!sel) return;
      const visible = sec.querySelectorAll(sel);
      if (visible.length === 0) {
        sec.classList.add('is-empty');
        emptySections.add(id);
      }
    });

    // 4) Ocultar los items del dock cuya sección quedó vacía.
    if (emptySections.size) {
      document.querySelectorAll('.dock-item[data-tab]').forEach((item) => {
        if (emptySections.has(item.dataset.tab)) item.classList.add('is-empty');
      });
      this.updateDockOverflow();
    }
  }


  /**
   * Recorre las imágenes de las cards tras la carga y:
   *  - las marca como `is-empty` si la API no devolvió URL
   *  - las marca como `broken` si fallan al cargar (onerror)
   * Inserta un placeholder FontAwesome para que la card nunca quede en blanco.
   */
  applyImageFallbacks() {
    // 1) <img> sin src útil -> placeholder inmediato
    document.querySelectorAll('img[src=""], img:not([src])').forEach((img) => {
      this._showImagePlaceholder(img);
    });

    // 2) <img> que fallen al cargar (404, CORS, etc.) -> placeholder
    document.querySelectorAll('.n-lite-img, .g-card img, .a-photo img, .s-logo img, .m-thumb img').forEach((img) => {
      if (!img.getAttribute('src')) return;
      img.addEventListener('error', () => this._showImagePlaceholder(img), { once: true });
    });

    // 3) background-image vacío en .n-lite-img (la API no devolvió URL)
    document.querySelectorAll('.n-lite-img').forEach((el) => {
      const bg = el.getAttribute('style') || '';
      const hasUrl = /url\(['"]?https?:|url\(['"]?\/api/.test(bg);
      if (!hasUrl && !el.querySelector('.ph')) {
        this._showBgPlaceholder(el);
      }
    });

    // 4) gc-bg / dj-img con style sin URL -> gradient fallback
    document.querySelectorAll('.gc-bg, .dj-img').forEach((el) => {
      const bg = el.getAttribute('style') || '';
      const hasUrl = /url\(/.test(bg);
      if (!hasUrl) {
        el.style.background = 'linear-gradient(140deg, rgba(255,119,0,0.25), rgba(255,45,149,0.25))';
      }
    });
  }

  _showImagePlaceholder(img) {
    if (img.dataset.fallback) return;
    img.dataset.fallback = '1';
    img.classList.add('broken');

    const container = img.parentElement;
    if (!container) return;

    const iconName = container.classList.contains('a-photo') ? 'user'
                   : container.classList.contains('s-logo') ? 'building'
                   : 'image';

    const ph = document.createElement('span');
    ph.className = 'ph';
    ph.innerHTML = `<i class="fas fa-${iconName}"></i>`;
    container.appendChild(ph);
  }

  _showBgPlaceholder(el) {
    el.style.background = 'linear-gradient(140deg, rgba(255,119,0,0.25), rgba(255,45,149,0.25))';
    if (el.querySelector('.ph')) return;
    const ph = document.createElement('span');
    ph.className = 'ph';
    ph.innerHTML = '<i class="fas fa-image"></i>';
    el.appendChild(ph);
  }


  // ==========================================================
  // SCROLL-SPY / DOCK
  // ==========================================================

  setupScrollSpy() {
    const dock = document.getElementById('dock');
    if (!dock) return;

    const items = Array.from(dock.querySelectorAll('.dock-item[data-tab]'));
    const sections = items
      .map((it) => document.getElementById(it.dataset.tab))
      .filter(Boolean);

    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          items.forEach((it) => {
            const matches = it.dataset.tab === id;
            it.classList.toggle('active', matches);
          });
        }
      });
    }, {
      rootMargin: '-40% 0px -55% 0px',
      threshold: 0
    });

    sections.forEach((s) => observer.observe(s));

    // Smooth scroll al hacer click
    dock.querySelectorAll('.dock-item').forEach((item) => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        const target = document.getElementById(tab);
        if (!target) return;
        if (tab === 'tv' && this.videoStreamUrl) {
          this.startTV();
        }
        const dockH = document.getElementById('dock')?.offsetHeight || 70;
        const top = target.getBoundingClientRect().top + window.scrollY - dockH + 1;
        window.scrollTo({ top, behavior: 'smooth' });
        const overflow = document.getElementById('dock-overflow');
        if (overflow) overflow.style.display = 'none';
      });
    });
  }

  setupAnchors() {
    // CTA principal: scroll al hero y play
    const ctaPlay = document.getElementById('cta-play');
    if (ctaPlay) {
      ctaPlay.addEventListener('click', async () => {
        const hero = document.getElementById('hero');
        if (hero) {
          const top = hero.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top, behavior: 'smooth' });
        }
        // Pequeño delay para que el scroll se vea natural, luego play
        setTimeout(() => this.audioPlayer.play().catch(() => {}), 350);
      });
    }

    // Enganchar cualquier href interno como scroll suave
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const hash = a.getAttribute('href');
      if (hash.length < 2) return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      const dockH = document.getElementById('dock')?.offsetHeight || 70;
      const top = target.getBoundingClientRect().top + window.scrollY - dockH + 1;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  }

  setupHeroBackground() {
    const heroBg = document.getElementById('hero-bg');
    const artworkEl = document.getElementById('track-artwork');
    if (!heroBg || !artworkEl) return;

    const applyBg = (url) => {
      if (!url) return;
      const probe = new Image();
      probe.onload = () => {
        heroBg.style.backgroundImage = `url("${url}")`;
        heroBg.classList.add('loaded');
      };
      probe.onerror = () => {
        heroBg.style.backgroundImage = '';
        heroBg.classList.remove('loaded');
      };
      probe.src = url;
    };

    const syncFromArtwork = () => {
      const url = artworkEl.getAttribute('src') || artworkEl.src;
      if (url) applyBg(url);
      else if (this._radioCoverUrl) applyBg(this._radioCoverUrl);
    };

    // Sincronización inicial: el artwork ya trae src de la carga básica
    syncFromArtwork();
    // Reintento breve por si la URL se setea después del primer frame
    setTimeout(syncFromArtwork, 400);

    // Reaccionar a cada cambio de cover (cuando cambia el tema en reproducción)
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'src') syncFromArtwork();
      }
    });
    observer.observe(artworkEl, { attributes: true, attributeFilter: ['src'] });
  }

  updateDockOverflow() {
    const dock = document.getElementById('dock');
    const moreBtn = document.getElementById('dock-more');
    const overflowIn = document.getElementById('dock-overflow-content');
    if (!dock || !moreBtn || !overflowIn) return;

    dock.querySelectorAll('.dock-item[data-overflowed]').forEach((el) => {
      el.style.display = '';
      el.removeAttribute('data-overflowed');
    });

    const items = Array.from(dock.querySelectorAll('.dock-item'))
      .filter((el) => el.style.display !== 'none');

    const avail = dock.clientWidth - 60;
    let used = 0;
    const spill = [];

    items.forEach((item) => {
      const w = item.offsetWidth || 56;
      if (used + w <= avail) used += w;
      else spill.push(item);
    });

    if (spill.length) {
      moreBtn.style.display = 'flex';
      overflowIn.innerHTML = '';
      spill.forEach((item) => {
        item.style.display = 'none';
        item.setAttribute('data-overflowed', '1');
        const clone = item.cloneNode(true);
        clone.style.display = 'flex';
        clone.removeAttribute('data-overflowed');
        clone.addEventListener('click', () => {
          document.getElementById('dock-overflow').style.display = 'none';
          item.click();
        });
        overflowIn.appendChild(clone);
      });
    } else {
      moreBtn.style.display = 'none';
      overflowIn.innerHTML = '';
    }

    const overflow = document.getElementById('dock-overflow');
    if (moreBtn && overflow) {
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        overflow.style.display = overflow.style.display === 'none' ? 'block' : 'none';
      });
      if (!overflow._wired) {
        overflow._wired = true;
        document.addEventListener('click', (e) => {
          if (overflow.style.display !== 'none' &&
              !e.target.closest('#dock-overflow') && !e.target.closest('#dock-more')) {
            overflow.style.display = 'none';
          }
        });
      }
    }

    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => this.updateDockOverflow(), 200);
    });
  }

  // ==========================================================
  // SCROLL REVEAL
  // ==========================================================

  setupRevealOnScroll() {
    const els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
  }

  // ==========================================================
  // STATS COUNTERS
  // ==========================================================

  setupStatCounters() {
    const nums = document.querySelectorAll('.stat-num[data-count]');
    if (!nums.length) return;

    const animate = (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const isZero = target === 0;
      if (isZero) { el.textContent = el.textContent || '∞'; return; }
      const dur = 1400;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased).toString();
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = target.toString();
      };
      requestAnimationFrame(step);
    };

    if (!('IntersectionObserver' in window)) {
      nums.forEach(animate);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    nums.forEach((n) => io.observe(n));
  }

  // ==========================================================
  // MARQUEE LOOP (duplica el contenido para loop continuo)
  // ==========================================================

  setupMarqueeLoop() {
    const track = document.getElementById('marquee-track');
    if (!track) return;
    track.innerHTML = track.innerHTML + track.innerHTML;
  }

  // ==========================================================
  // NOTICIAS
  // ==========================================================

  async loadNewsSection() {
    const dm = getDataManager();
    const result = await dm.loadNews(1, 6);
    const items = result?.data || [];
    const el = document.getElementById('news-list');
    if (!el) return;

    if (!items.length) {
      const col = el.closest('.col, .block');
      // No añadir .has-content: CSS mantiene oculto este contenedor.
      return;
    }
    for (const item of items) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    el.innerHTML = items.map((item) => `
      <article class="n-lite" data-slug="${this.esc(item.slug)}">
        <div class="n-lite-img" style="background-image:url('${this.esc(item.imageUrl || '')}')"></div>
        <div class="n-lite-body">
          <h4>${this.esc(item.name)}</h4>
          <small>${this.fmtDate(item.createdAt)}</small>
        </div>
      </article>`).join('');

    this._hasMore.news = this.hasMorePages(result?.pagination, this.currentPage.news);
    this.setMoreBtn('news-more', this._hasMore.news);
  }

  async loadMoreNews() {
    if (this._loadingMore.news || !this._hasMore.news) return;
    this._loadingMore.news = true;
    this.currentPage.news++;

    const dm = getDataManager();
    const result = await dm.loadNews(this.currentPage.news, 6);
    const items = result?.data || [];
    if (!items.length) {
      this._hasMore.news = false;
      this.setMoreBtn('news-more', false);
      this._loadingMore.news = false;
      return;
    }
    for (const item of items) {
      if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
    }
    const el = document.getElementById('news-list');
    if (el) el.insertAdjacentHTML('beforeend', items.map((item) => `
      <article class="n-lite" data-slug="${this.esc(item.slug)}">
        <div class="n-lite-img" style="background-image:url('${this.esc(item.imageUrl || '')}')"></div>
        <div class="n-lite-body">
          <h4>${this.esc(item.name)}</h4>
          <small>${this.fmtDate(item.createdAt)}</small>
        </div>
      </article>`).join(''));

    this._hasMore.news = this.hasMorePages(result?.pagination, this.currentPage.news);
    this.setMoreBtn('news-more', this._hasMore.news);
    this._loadingMore.news = false;
  }

  async loadBreakingNews() {
    const dm = getDataManager();
    const result = await dm.loadNews(1, 5);
    const items = result?.data || [];
    const el = document.getElementById('breaking-ticker');
    const wrap = document.getElementById('ticker-wrap');
    if (!items.length || !el) return;
    const html = items.map((n) =>
      `<span class="ticker-item" data-slug="${this.esc(n.slug)}">${this.esc(n.name)}</span>`
    ).join('');
    el.innerHTML = html + html;
    if (wrap) wrap.style.display = 'flex';
  }

  async loadNewsDetail(slug) {
    const dm = getDataManager();
    const news = await dm.loadNewsBySlug(slug);
    if (!news) return;
    if (news.imageUrl) news.imageUrl = await dm.getImageUrl(news.imageUrl);
    const body = document.getElementById('news-modal-body');
    if (!body) return;
    body.innerHTML = `
      <h2>${this.esc(news.name)}</h2>
      <div class="modal-meta">
        <span><i class="fas fa-calendar"></i> ${this.fmtDate(news.createdAt, true)}</span>
        ${news.author ? `<span><i class="fas fa-user"></i> ${this.esc(news.author)}</span>` : ''}
      </div>
      ${news.imageUrl ? `<img class="m-hero" src="${this.esc(news.imageUrl)}" alt="${this.esc(news.name)}">` : ''}
      <div class="news-content">${news.longText || news.description || this.esc(news.shortText || '')}</div>
    `;
    this.openModal('news-modal');
  }

  // ==========================================================
  // PROGRAMACIÓN
  // ==========================================================

  async loadPrograms() {
    const dm = getDataManager();
    const programs = await dm.loadPrograms();
    if (!programs || !programs.length) {
      const block = document.querySelector('.prog-block');
      if (block) { /* no has-content: CSS oculta */ }
      return;
    }
    this._programDayMap = {};
    for (const p of programs) {
      const days = p.weekDays || (p.day ? [p.day] : []);
      for (const d of days) {
        const esDay = DAY_ES[String(d).toLowerCase()] || d;
        if (!this._programDayMap[esDay]) this._programDayMap[esDay] = [];
        this._programDayMap[esDay].push(p);
      }
    }

    const todayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date().getDay()];
    this._selectedDay = this._programDayMap[todayName]
      ? todayName
      : (Object.keys(this._programDayMap)[0] || 'Lunes');

    this.renderProgramsTimeline();
    this.setupDayNav();
  }

  renderProgramsTimeline() {
    const el = document.getElementById('programs-timeline');
    if (!el) return;
    const list = (this._programDayMap[this._selectedDay] || [])
      .slice()
      .sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')));

    if (!list.length) {
      el.innerHTML = '<p class="empty-msg">Sin programación para este día</p>';
      return;
    }

    const todayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date().getDay()];
    const isToday = this._selectedDay === todayName;

    el.innerHTML = list.map((p) => {
      const live = isToday && this.isOnAir(p.startTime, p.endTime);
      return `
        <div class="p-item${live ? ' on-now' : ''}" data-id="${this.esc(p.id)}">
          <div class="p-time">
            <span class="p-start">${this.esc(p.startTime || '')}</span>
            ${p.endTime ? `<span class="p-end">${this.esc(p.endTime)}</span>` : ''}
          </div>
          <div class="p-bar"></div>
          <div class="p-info">
            ${live ? '<span class="p-live">AL AIRE</span>' : ''}
            <span class="p-name">${this.esc(p.name)}</span>
            ${p.host ? `<span class="p-host"><i class="fas fa-microphone"></i> ${this.esc(p.host)}</span>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  setupDayNav() {
    const nav = document.getElementById('day-nav');
    if (!nav) return;
    nav.querySelectorAll('.day-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dayName = DAY_KEYS[btn.dataset.day];
        if (!dayName || dayName === this._selectedDay) return;
        this._selectedDay = dayName;
        nav.querySelectorAll('.day-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderProgramsTimeline();
      });
    });
    const activeKey = Object.keys(DAY_KEYS).find((k) => DAY_KEYS[k] === this._selectedDay);
    const activeBtn = nav.querySelector(`[data-day="${activeKey}"]`);
    if (activeBtn) activeBtn.classList.add('active');
  }

  async loadProgramDetail(id) {
    const dm = getDataManager();
    const programs = await dm.loadPrograms();
    const p = (programs || []).find((x) => x.id === id);
    if (!p) return;
    const days = (p.weekDays || []).map((d) => DAY_ES[String(d).toLowerCase()] || d).join(', ');
    const body = document.getElementById('program-modal-body');
    if (!body) return;
    body.innerHTML = `
      <h2>${this.esc(p.name)}</h2>
      <div class="modal-meta">
        <span><i class="fas fa-clock"></i> ${this.esc(p.startTime || '')}${p.endTime ? ' – ' + this.esc(p.endTime) : ''}</span>
        ${p.host ? `<span><i class="fas fa-microphone"></i> ${this.esc(p.host)}</span>` : ''}
        ${days ? `<span><i class="fas fa-calendar-week"></i> ${this.esc(days)}</span>` : ''}
      </div>
      <p>${this.esc(p.description || '')}</p>
    `;
    this.openModal('program-modal');
  }

  // ==========================================================
  // PODCASTS
  // ==========================================================

  async loadPodcastsList() {
    const dm = getDataManager();
    const result = await dm.loadPodcasts(1, 6);
    const items = result?.data || [];
    const el = document.getElementById('podcasts-list');
    if (!items.length) {
      const col = el?.closest('.col, .block');
      // No añadir .has-content: CSS mantiene oculto este contenedor.
      return;
    }
    for (const p of items) {
      if (p.imageUrl) p.imageUrl = await dm.getImageUrl(p.imageUrl);
    }
    if (el) el.innerHTML = items.map((p) => `
      <article class="n-lite pod-card" data-id="${this.esc(p.id)}">
        <div class="n-lite-img" style="background-image:url('${this.esc(p.imageUrl || '')}')"></div>
        <div class="n-lite-body">
          <h4>${this.esc(p.title)}</h4>
          <small>${this.fmtDate(p.createdAt)}${p.duration ? ' · ' + this.esc(p.duration) : ''}</small>
        </div>
      </article>`).join('');

    this._hasMore.podcasts = this.hasMorePages(result?.pagination, this.currentPage.podcasts);
    this.setMoreBtn('podcasts-more', this._hasMore.podcasts);
  }

  async loadMorePodcasts() {
    if (this._loadingMore.podcasts || !this._hasMore.podcasts) return;
    this._loadingMore.podcasts = true;
    this.currentPage.podcasts++;

    const dm = getDataManager();
    const result = await dm.loadPodcasts(this.currentPage.podcasts, 6);
    const items = result?.data || [];
    if (!items.length) {
      this._hasMore.podcasts = false;
      this.setMoreBtn('podcasts-more', false);
      this._loadingMore.podcasts = false;
      return;
    }
    for (const p of items) {
      if (p.imageUrl) p.imageUrl = await dm.getImageUrl(p.imageUrl);
    }
    const el = document.getElementById('podcasts-list');
    if (el) el.insertAdjacentHTML('beforeend', items.map((p) => `
      <article class="n-lite pod-card" data-id="${this.esc(p.id)}">
        <div class="n-lite-img" style="background-image:url('${this.esc(p.imageUrl || '')}')"></div>
        <div class="n-lite-body">
          <h4>${this.esc(p.title)}</h4>
          <small>${this.fmtDate(p.createdAt)}${p.duration ? ' · ' + this.esc(p.duration) : ''}</small>
        </div>
      </article>`).join(''));

    this._hasMore.podcasts = this.hasMorePages(result?.pagination, this.currentPage.podcasts);
    this.setMoreBtn('podcasts-more', this._hasMore.podcasts);
    this._loadingMore.podcasts = false;
  }

  async loadPodcastDetail(id) {
    const dm = getDataManager();
    const p = await dm.loadPodcastById(id);
    if (!p) return;
    if (p.imageUrl) p.imageUrl = await dm.getImageUrl(p.imageUrl);

    const body = document.getElementById('podcast-modal-body');
    const audio = document.getElementById('podcast-audio');
    if (body) {
      body.innerHTML = `
        <h2>${this.esc(p.title)}</h2>
        <div class="modal-meta">
          ${p.episodeNumber ? `<span><i class="fas fa-hashtag"></i> Episodio ${this.esc(p.episodeNumber)}</span>` : ''}
          ${p.season ? `<span><i class="fas fa-layer-group"></i> Temporada ${this.esc(p.season)}</span>` : ''}
          ${p.duration ? `<span><i class="fas fa-clock"></i> ${this.esc(p.duration)}</span>` : ''}
        </div>
        ${p.imageUrl ? `<img class="m-hero" src="${this.esc(p.imageUrl)}" alt="${this.esc(p.title)}">` : ''}
        <div class="news-content">${p.description || this.esc(p.shortText || '')}</div>
      `;
    }
    if (audio) {
      audio.src = p.audioUrl || p.fileUrl || p.url || p.audio || '';
      audio.load();
    }
    this.openModal('podcast-modal');
    if (audio) audio.play().catch(() => {});
  }

  // ==========================================================
  // VIDEOCASTS
  // ==========================================================

  async loadVideocastsList() {
    const dm = getDataManager();
    const result = await dm.loadVideocasts(1, 6);
    const items = result?.data || [];
    const el = document.getElementById('videocasts-list');
    if (!items.length) {
      const col = el?.closest('.col, .block');
      // No añadir .has-content: CSS mantiene oculto este contenedor.
      return;
    }
    for (const v of items) {
      if (v.imageUrl) v.imageUrl = await dm.getImageUrl(v.imageUrl);
    }
    if (el) el.innerHTML = items.map((v) => `
      <article class="m-card vc-card" data-id="${this.esc(v.id)}">
        <div class="m-thumb">
          <img src="${this.esc(v.imageUrl || '')}" alt="${this.esc(v.title)}" loading="lazy">
          <div class="m-play"><i class="fas fa-play"></i></div>
        </div>
        <div class="m-body">
          <h3>${this.esc(v.title)}</h3>
          <small>${this.fmtDate(v.createdAt)}</small>
        </div>
      </article>`).join('');
  }

  async loadVideocastDetail(id) {
    const dm = getDataManager();
    const vc = await dm.loadVideocastById(id);
    if (!vc) return;
    const body = document.getElementById('videocast-modal-body');
    if (!body) return;
    const videoId = this.extractYouTubeId(vc.videoUrl);
    body.innerHTML = videoId
      ? `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
         <h2>${this.esc(vc.title)}</h2>
         <div class="news-content">${vc.description || ''}</div>`
      : '<p class="empty-msg">Video no disponible</p>';
    this.openModal('videocast-modal');
  }

  extractYouTubeId(url) {
    if (!url) return null;
    const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  // ==========================================================
  // RANKING
  // ==========================================================

  async loadVideosRanking() {
    const dm = getDataManager();
    const result = await dm.loadVideos();
    const videos = result?.data || result || [];
    const el = document.getElementById('videos-ranking');
    if (!el) return;
    if (!videos.length) {
      const col = el.closest('.col, .block');
      // No añadir .has-content: CSS mantiene oculto este contenedor.
      return;
    }
    el.innerHTML = videos
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((v, i) => `
        <div class="r-item" data-url="${this.esc(v.videoUrl || '')}">
          <span class="r-num">${String(v.order || i + 1).padStart(2, '0')}</span>
          <div class="r-info">
            <strong>${this.esc(v.name)}</strong>
            ${v.description ? `<p>${this.esc(v.description)}</p>` : ''}
          </div>
          <span class="r-go"><i class="fas fa-play"></i></span>
        </div>
      `).join('');
  }

  // ==========================================================
  // ENCUESTAS
  // ==========================================================

  async loadPolls() {
    const dm = getDataManager();
    const polls = await dm.loadPolls();
    const active = (polls || []).filter((p) => p.active);
    const el = document.getElementById('polls-container');
    if (!active.length || !el) {
      const wrap = el?.closest('.block');
      if (wrap) wrap.style.display = 'none';
      return;
    }
    el.innerHTML = active.map((poll) => {
      const q = poll.question || poll.title || poll.name || '';
      return `
        <div class="poll-card" data-id="${this.esc(poll.id)}">
          <h3 class="poll-q">${this.esc(q)}</h3>
          <div class="poll-opts">
            ${(poll.options || []).map((opt) => `
              <button class="poll-opt" data-poll-id="${this.esc(poll.id)}" data-option-id="${this.esc(opt.id)}">
                <span class="poll-bar" style="width:0%"></span>
                <span class="poll-label">${this.esc(opt.text || '')}</span>
                <span class="poll-count">${opt.votes || 0}</span>
              </button>
            `).join('')}
          </div>
          <p class="poll-voted"><i class="fas fa-circle-check"></i> ¡Gracias por votar!</p>
        </div>`;
    }).join('');
  }

  async handleVote(pollId, optionId) {
    const dm = getDataManager();
    const card = document.querySelector(`.poll-card[data-id="${pollId}"]`);
    if (card) card.querySelectorAll('.poll-opt').forEach((b) => { b.disabled = true; });
    try {
      await dm.votePoll(pollId, optionId);
      const polls = await dm.loadPolls(true);
      const poll = (polls || []).find((p) => p.id === pollId);
      if (!poll || !card) return;
      const total = (poll.options || []).reduce((s, o) => s + (o.votes || 0), 0);
      card.querySelectorAll('.poll-opt').forEach((btn, i) => {
        const opt = (poll.options || [])[i];
        if (!opt) return;
        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
        const bar = btn.querySelector('.poll-bar');
        const count = btn.querySelector('.poll-count');
        if (bar) bar.style.width = pct + '%';
        if (count) count.textContent = `${opt.votes} · ${pct}%`;
      });
      const msg = card.querySelector('.poll-voted');
      if (msg) msg.style.display = 'flex';
    } catch (error) {
      if (card) card.querySelectorAll('.poll-opt').forEach((b) => { b.disabled = false; });
    }
  }

  // ==========================================================
  // EVENTOS
  // ==========================================================

  async loadEventsTimeline() {
    const dm = getDataManager();
    const events = await dm.loadEvents();
    const el = document.getElementById('events-timeline');
    if (!events || !events.length) {
      const col = el?.closest('.col, .block');
      // No añadir .has-content: CSS mantiene oculto este contenedor.
      return;
    }
    const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    el.innerHTML = sorted.map((e) => {
      const d = new Date(e.date);
      const name = this.pick(e, 'title', 'name');
      return `
        <article class="e-lite">
          <div class="e-lite-date">
            <span class="e-lite-day">${d.getDate()}</span>
            <span class="e-lite-month">${d.toLocaleDateString('es-ES', { month: 'short' })}</span>
          </div>
          <div class="e-lite-info">
            <h4>${this.esc(name)}</h4>
            <small><i class="fas fa-clock"></i> ${this.esc(e.time || '')}</small>
            ${e.location ? `<small><i class="fas fa-location-dot"></i> ${this.esc(e.location)}</small>` : ''}
          </div>
        </article>`;
    }).join('');
  }

  // ==========================================================
  // AUSPICIADORES
  // ==========================================================

  async loadSponsors() {
    const dm = getDataManager();
    const sponsors = await dm.loadSponsors();
    if (!sponsors || !sponsors.length) {
      const col = document.querySelector('.col:has(#sponsors-carousel)');
      if (col) { /* no has-content: CSS oculta */ }
      return;
    }
    for (const s of sponsors) {
      if (s.logoUrl) s.logoUrl = await dm.getImageUrl(s.logoUrl);
    }

    const carousel = document.getElementById('sponsors-carousel');
    if (carousel) {
      carousel.innerHTML = sponsors.map((s) => `
        <div class="swiper-slide">
          <a href="${this.esc(s.website || '#')}" target="_blank" rel="noopener" title="${this.esc(s.name)}">
            <img src="${this.esc(s.logoUrl || '')}" alt="${this.esc(s.name)}" loading="lazy">
          </a>
        </div>
      `).join('');
    }

    const grid = document.getElementById('sponsors-grid');
    if (grid) {
      grid.innerHTML = sponsors.slice(0, 4).map((s) => `
        <div class="s-card">
          <div class="s-logo">${s.logoUrl ? `<img src="${this.esc(s.logoUrl)}" alt="${this.esc(s.name)}" loading="lazy">` : ''}</div>
          <h3>${this.esc(s.name)}</h3>
        </div>`).join('');
    }
  }

  // ==========================================================
  // LOCUTORES
  // ==========================================================

  async loadAnnouncersGrid() {
    const dm = getDataManager();
    const announcers = await dm.loadAnnouncers();
    const el = document.getElementById('announcers-grid');
    if (!announcers || !announcers.length) {
      const wrap = el?.closest('.block');
      if (wrap) wrap.style.display = 'none';
      return;
    }
    for (const a of announcers) {
      const photo = this.pick(a, 'photoUrl', 'imageUrl');
      if (photo) a._photo = await dm.getImageUrl(photo);
    }
    el.innerHTML = announcers.map((a) => {
      const bio = this.pick(a, 'biography', 'description');
      return `
        <div class="a-card">
          <div class="a-photo"><img src="${this.esc(a._photo || '')}" alt="${this.esc(a.name)}" loading="lazy"></div>
          <h3>${this.esc(a.name)}</h3>
          ${bio ? `<p>${this.esc(bio)}</p>` : ''}
        </div>`;
    }).join('');
  }

  // ==========================================================
  // GALERÍAS
  // ==========================================================

  async loadGalleriesList() {
    const dm = getDataManager();
    const galleries = await dm.loadGalleries();
    const el = document.getElementById('galleries-list');
    if (!galleries || !galleries.length) {
      const wrap = el?.closest('.block');
      if (wrap) wrap.style.display = 'none';
      return;
    }
    for (const g of galleries) {
      if (g.imageUrl) g.imageUrl = await dm.getImageUrl(g.imageUrl);
      for (const img of (g.images || [])) {
        if (img.imageUrl) img.imageUrl = await dm.getImageUrl(img.imageUrl);
      }
    }
    this._galleryCache = galleries;
    el.innerHTML = galleries.map((g) => {
      const name = this.pick(g, 'title', 'name');
      const cover = g.imageUrl || (g.images || [])[0]?.imageUrl || '';
      return `
        <div class="g-card" data-id="${this.esc(g.id)}">
          ${cover ? `<img src="${this.esc(cover)}" alt="${this.esc(name)}" loading="lazy">` : ''}
          <div class="g-body">
            <h3>${this.esc(name)}</h3>
            <small><i class="fas fa-images"></i> ${(g.images || []).length} imágenes</small>
          </div>
        </div>`;
    }).join('');
  }

  openGallery(id) {
    const gallery = (this._galleryCache || []).find((g) => g.id === id);
    if (!gallery) return;
    const name = this.pick(gallery, 'title', 'name');
    const images = (gallery.images || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    const body = document.getElementById('gallery-modal-body');
    const thumbs = document.getElementById('gallery-thumbnails');
    if (body) {
      body.innerHTML = images.length
        ? `<h2>${this.esc(name)}</h2><img src="${this.esc(images[0].imageUrl)}" class="gallery-main" alt="${this.esc(name)}">`
        : '<p class="empty-msg">Sin imágenes</p>';
    }
    if (thumbs) {
      thumbs.innerHTML = images.map((img, i) =>
        `<img src="${this.esc(img.imageUrl)}" class="gallery-thumb${i === 0 ? ' active' : ''}" data-url="${this.esc(img.imageUrl)}" loading="lazy">`
      ).join('');
    }
    this.openModal('gallery-modal');
  }

  // ==========================================================
  // ÚLTIMOS TEMAS
  // ==========================================================

  async loadRecentTracks() {
    try {
      const dm = getDataManager();
      const song = await dm.loadCurrentSong();
      const el = document.getElementById('recent-tracks');
      if (!song || !song.history || !song.history.length) {
        const col = el?.closest('.col, .block');
        if (col) { /* no has-content: CSS oculta */ }
        return;
      }
      this.renderRecentTracks(song.history);
    } catch (e) {
      const el = document.getElementById('recent-tracks');
      const col = el?.closest('.col, .block');
      // No añadir .has-content: CSS mantiene oculto este contenedor.
    }
  }

  renderRecentTracks(history) {
    const el = document.getElementById('recent-tracks');
    if (!el) return;
    el.innerHTML = history.slice(0, 12).map((track) => {
      const clean = String(track).replace(/<br\s*\/?>/gi, '').replace(/^\d+\.\)\s*/, '').trim();
      return `<div class="t-item"><i class="fas fa-compact-disc t-ico"></i><span>${this.esc(clean)}</span></div>`;
    }).join('');
  }

  // ==========================================================
  // TV
  // ==========================================================

  async checkTV() {
    try {
      const dm = getDataManager();
      this.videoStreamUrl = await dm.loadVideoStreamUrl();
      if (!this.videoStreamUrl) {
        const sec = document.getElementById('tv');
        if (sec) sec.style.display = 'none';
        const item = document.querySelector('.dock-item[data-tab="tv"]');
        if (item) item.style.display = 'none';
        return;
      }
      const heroBtn = document.getElementById('hero-tv-btn');
      if (heroBtn) heroBtn.style.display = 'inline-flex';
    } catch (e) {
      const sec = document.getElementById('tv');
      if (sec) sec.style.display = 'none';
      const item = document.querySelector('.dock-item[data-tab="tv"]');
      if (item) item.style.display = 'none';
    }
  }

  startTV() {
    if (!this.videoStreamUrl || this._tvPlayer || !window.VideoPlayer) return;
    try {
      const player = new window.VideoPlayer('tv-player-container', { autoplay: true, controls: true, muted: false });
      this._tvPlayer = player;
      const wait = setInterval(() => {
        if (player.videoElement) {
          clearInterval(wait);
          player.loadStream(this.videoStreamUrl);
        }
      }, 120);
    } catch (e) {}
  }

  // ==========================================================
  // MODALES
  // ==========================================================

  setupModalHandlers() {
    document.querySelectorAll('.modal').forEach((modal) => {
      const close = modal.querySelector('.modal-close');
      if (close) close.addEventListener('click', () => this.closeModal(modal.id));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal.id);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach((m) => this.closeModal(m.id));
      }
    });

    document.addEventListener('click', (e) => {
      const slug = e.target.closest('[data-slug]');
      if (slug && (slug.closest('.n-lite') || slug.closest('.ticker-item'))) {
        e.preventDefault();
        this.loadNewsDetail(slug.dataset.slug);
        return;
      }

      const pod = e.target.closest('.pod-card[data-id]');
      if (pod) { this.loadPodcastDetail(pod.dataset.id); return; }

      const vc = e.target.closest('.vc-card[data-id]');
      if (vc) { this.loadVideocastDetail(vc.dataset.id); return; }

      const prog = e.target.closest('.p-item[data-id]');
      if (prog) { this.loadProgramDetail(prog.dataset.id); return; }

      const rank = e.target.closest('.r-item[data-url]');
      if (rank) {
        e.preventDefault();
        const id = this.extractYouTubeId(rank.dataset.url);
        const body = document.getElementById('video-modal-body');
        if (id && body) {
          body.innerHTML = `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
          this.openModal('video-modal');
        }
        return;
      }

      const gal = e.target.closest('.g-card[data-id]');
      if (gal) { this.openGallery(gal.dataset.id); return; }

      const thumb = e.target.closest('.gallery-thumb');
      if (thumb) {
        const main = document.querySelector('.gallery-main');
        if (main) main.src = thumb.dataset.url;
        document.querySelectorAll('.gallery-thumb').forEach((t) => t.classList.remove('active'));
        thumb.classList.add('active');
        return;
      }

      const opt = e.target.closest('.poll-opt');
      if (opt && !opt.disabled) {
        this.handleVote(opt.dataset.pollId, opt.dataset.optionId);
      }
    });
  }

  openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => modal.classList.add('active'));
  }

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => { modal.style.display = 'none'; }, 260);
    }
    document.body.style.overflow = '';
    const audio = document.getElementById('podcast-audio');
    if (audio && !audio.paused) audio.pause();
    if (id === 'videocast-modal' || id === 'video-modal') {
      const body = document.getElementById(id + '-body');
      if (body) body.innerHTML = '';
    }
  }

  setupLoadMore() {
    const map = {
      'news-load-more': () => this.loadMoreNews(),
      'podcasts-load-more': () => this.loadMorePodcasts()
    };
    Object.entries(map).forEach(([id, fn]) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', fn);
    });
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
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Enviando...</span>';
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
            feedback.textContent = data.message || 'Gracias por tu mensaje.';
            feedback.style.display = 'block';
          }
          form.reset();
        } else throw new Error(data.message || 'Error al enviar el mensaje');
      } catch (err) {
        if (feedback) {
          feedback.className = 'contact-feedback error';
          feedback.textContent = err.message || 'Error al enviar el mensaje.';
          feedback.style.display = 'block';
        }
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i><span>Enviar</span>';
      }
    });
  }

  // ==========================================================
  // COVER / HOOKS
  // ==========================================================

  _setHeroCover(url) {
    const img = document.getElementById('track-artwork');
    const def = document.getElementById('default-artwork');
    const bg = document.getElementById('hero-bg');
    if (img) {
      img.src = url;
      img.style.display = 'block';
      if (def) def.style.display = 'none';
    }
    if (bg) {
      bg.style.backgroundImage = `url('${url}')`;
      bg.classList.add('loaded');
    }
  }

  _showHeroDefault() {
    const img = document.getElementById('track-artwork');
    const def = document.getElementById('default-artwork');
    const bg = document.getElementById('hero-bg');
    if (img) img.style.display = 'none';
    if (def) def.style.display = 'grid';
    if (bg) {
      bg.style.backgroundImage = '';
      bg.classList.remove('loaded');
    }
  }

  onBasicDataLoaded(data) {
    if (this._radioCoverUrl) this._setHeroCover(this._radioCoverUrl);
    const title = document.getElementById('track-title');
    if (title && data?.projectName) {
      title.textContent = data.projectName;
      title.setAttribute('data-text', data.projectName);
    }

    const footName = document.getElementById('foot-name');
    if (footName && data?.projectName) footName.textContent = data.projectName;
  }

  onCurrentSongLoaded(songData) {
    const titleEl = document.getElementById('track-title');
    if (titleEl && songData.title) {
      titleEl.textContent = songData.title;
      titleEl.setAttribute('data-text', songData.title);
    }

    const artistEl = document.getElementById('track-artist');
    if (artistEl) {
      // getCurrentSong() ya devuelve artist correctamente parseado.
      // Si no hay artist real, mostramos "En Vivo" como fallback.
      artistEl.textContent = songData.artist && songData.artist !== songData.title
        ? songData.artist
        : 'En Vivo';
    }

    const coverImg = document.getElementById('track-artwork');
    const artUrl = songData.art || '';
    if (artUrl && artUrl !== coverImg?.src) {
      const probe = new Image();
      probe.onload = () => this._setHeroCover(artUrl);
      probe.onerror = () => {
        if (this._radioCoverUrl) this._setHeroCover(this._radioCoverUrl);
        else this._showHeroDefault();
      };
      probe.src = artUrl;
    } else if (!artUrl) {
      if (this._radioCoverUrl && coverImg?.src !== this._radioCoverUrl) {
        this._setHeroCover(this._radioCoverUrl);
      } else if (!this._radioCoverUrl) {
        this._showHeroDefault();
      }
    }
  }

  onAudioPlay() {
    super.onAudioPlay();
    document.body.classList.add('is-live');
    document.getElementById('cover-disc')?.classList.add('spinning');
    const status = document.getElementById('hero-status');
    if (status) status.textContent = 'EN VIVO';
    const label = document.getElementById('onair-label');
    if (label) label.textContent = 'AL AIRE';
  }

  onAudioPause() {
    super.onAudioPause();
    document.body.classList.remove('is-live');
    document.getElementById('cover-disc')?.classList.remove('spinning');
    const status = document.getElementById('hero-status');
    if (status) status.textContent = 'PAUSADO';
    const label = document.getElementById('onair-label');
    if (label) label.textContent = 'EN VIVO';
  }

  onAudioError(error) {
    super.onAudioError(error);
    document.body.classList.remove('is-live');
    document.getElementById('cover-disc')?.classList.remove('spinning');
    const status = document.getElementById('hero-status');
    if (status) status.textContent = 'ERROR';
  }

  // ==========================================================
  // CAROUSELS
  // ==========================================================

  setupCarousels() {
    if (typeof Swiper === 'undefined') return;
    setTimeout(() => {
      const sponsorSlides = document.querySelectorAll('#sponsors-carousel .swiper-slide');
      if (sponsorSlides.length && !this.sponsorsSwiper) {
        try {
          this.sponsorsSwiper = new Swiper('.sponsors-swiper', {
            loop: sponsorSlides.length > 2,
            autoplay: { delay: 2600, disableOnInteraction: false },
            slidesPerView: 'auto',
            spaceBetween: 14,
            freeMode: true
          });
        } catch (e) {}
      }
    }, 900);
  }

  // ==========================================================
  // UTILIDADES
  // ==========================================================

  setMoreBtn(id, show) {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? 'flex' : 'none';
  }

  hasMorePages(pagination, page) {
    if (!pagination) return false;
    if (typeof pagination.hasMore === 'boolean') return pagination.hasMore;
    const pages = pagination.totalPages ?? pagination.pages;
    if (typeof pages === 'number') return page < pages;
    if (typeof pagination.total === 'number' && typeof pagination.limit === 'number') {
      return page * pagination.limit < pagination.total;
    }
    return false;
  }

  pick(obj, ...keys) {
    for (const k of keys) {
      const v = obj?.[k];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return '';
  }

  isOnAir(start, end) {
    if (!start || !end) return false;
    const toMin = (t) => { const [h, m] = String(t).split(':').map(Number); return (h || 0) * 60 + (m || 0); };
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const s = toMin(start), e = toMin(end);
    return s <= e ? (cur >= s && cur < e) : (cur >= s || cur < e);
  }

  fmtDate(value, long = false) {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d)) return '';
    return long
      ? d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      : d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  destroy() {
    super.destroy();
    if (this.sponsorsSwiper) { try { this.sponsorsSwiper.destroy(); } catch (e) {} }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.ibizaRetroTemplate = new IbizaRetroTemplate();
    await window.ibizaRetroTemplate.init();
  } catch (error) {
    console.error('IbizaRetro landing: error init:', error);
  }
});

window.addEventListener('beforeunload', () => {
  if (window.ibizaRetroTemplate) window.ibizaRetroTemplate.destroy();
});

export default IbizaRetroTemplate;
