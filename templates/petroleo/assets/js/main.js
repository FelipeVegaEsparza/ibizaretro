/**
 * Template Petroleo - Refactorizado usando TemplateBase
 * Patrón single-page: todas las secciones visibles, sin navegación superior
 */
import TemplateBase from '/assets/js/template-base.js';
import { getDataManager } from '/assets/js/data-manager.js';

class PetroleoTemplate extends TemplateBase {
  constructor() {
    super({
      audioElementId: 'radio-audio',
      playButtonId: 'play-btn',
      volumeSliderId: 'volume-slider',
      defaultVolume: 50,
      socialContainerIds: ['header-social-main', 'footer-social'],
      customDomIds: {
        radioLogo: 'news-logo',
        footerRadioName: 'footer-title',
        trackTitle: 'player-song-title',
        trackArtist: 'player-song-artist',
        listenersCount: 'listeners-count',
        bitrate: 'bitrate',
        audioQuality: 'sidebar-quality',
        trackArtwork: 'track-artwork',
        defaultArtwork: 'default-artwork',
        currentDate: 'current-date',
        heroCarousel: 'hero-carousel',
        breakingNews: 'breaking-ticker',
        featuredNews: 'featured-news-grid',
        sponsorsCarousel: 'sponsors-carousel'
      }
    });

    this.currentPage = { events: 1, galleries: 1 };
    this.currentSection = 'home';
    this.currentFilter = 'all';
    this.currentTab = 'podcasts';
    this.currentScheduleDay = 'today';
    this.tvPlayer = null;

    this.dayMapping = {
      'monday': 'Lunes', 'tuesday': 'Martes', 'wednesday': 'Miércoles',
      'thursday': 'Jueves', 'friday': 'Viernes', 'saturday': 'Sábado', 'sunday': 'Domingo'
    };
    this.videoStreamUrl = null;
    this._tvPlayer = null;
    this._tvMode = null;
    this.heroSwiper = null;
    this.sponsorsSwiper = null;
    this.sectionStates = {};
  }

  getSpanishDay(englishDay) {
    if (!englishDay) return null;
    return this.dayMapping[englishDay.toLowerCase()] || englishDay;
  }

  toggleSectionVisibility(sectionName, hasData) {
    const section = document.getElementById(`${sectionName}-section`);

    if (section) {
      section.style.setProperty('display', hasData ? '' : 'none', 'important');
    }

    this.sectionStates[sectionName] = hasData;
  }

  async showSection(sectionName) {
    if (this.sectionStates && this.sectionStates[sectionName] === false) return;
    this.currentSection = sectionName;

    await this.loadSectionContent(sectionName);

    const section = document.getElementById(`${sectionName}-section`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async loadSectionContent(sectionName) {
    switch (sectionName) {
      case 'galleries':
        await this.loadAllGalleries();
        break;
      case 'announcers':
        await this.loadAllAnnouncers();
        break;
      case 'polls':
        await this.loadAllPolls();
        break;
      case 'events':
        await this.loadAllEvents();
        break;
      case 'videos':
        await this.loadAllVideos();
        break;
      case 'social':
        await this.loadSocialNetworks();
        break;
      default:
        break;
    }
  }

  async init() {
    await super.init();

    try {
      await this.checkTVAvailability();
      await this.loadAllContent();
      this.setupTabs();
      this.setupContactForm();
      this.setupCarousels();
      this.setupModalHandlers();

      console.log('PetroleoTemplate: Template fully initialized!');
    } catch (error) {
      console.error('PetroleoTemplate: Error in template-specific init:', error);
    }
  }

  // Verificar disponibilidad de TV
  async checkTVAvailability() {
    try {
      const dataManager = getDataManager();
      this.videoStreamUrl = await dataManager.loadVideoStreamUrl();
      const tvSection = document.getElementById('tv-online-section');
      const hasTV = !!this.videoStreamUrl;

      let hasRadio = false;
      try {
        const basicData = await dataManager.loadBasicData();
        if (basicData) {
          hasRadio = !!(basicData.radioStreamingUrl || basicData.radioStreamUrl);
        }
      } catch (e) {
        hasRadio = false;
      }

      if (hasTV && hasRadio) this._tvMode = 'both';
      else if (hasTV) this._tvMode = 'tv';
      else this._tvMode = 'radio';

      if (hasTV && tvSection) {
        tvSection.style.display = 'block';
        const tvContainer = document.getElementById('tv-player-container');
        if (tvContainer && window.VideoPlayer) {
          const player = new window.VideoPlayer('tv-player-container', {
            autoplay: true, controls: false, muted: false
          });
          this._tvPlayer = player;
          const waitForVideo = setInterval(() => {
            if (player.videoElement) {
              clearInterval(waitForVideo);
              player.loadStream(this.videoStreamUrl);
            }
          }, 100);
        }
      }

      if (hasTV) {
        const fixedPlayer = document.getElementById('fixed-player');
        if (fixedPlayer) {
          if (this._tvMode === 'both') {
            document.body.style.paddingBottom = '80px';
          } else {
            fixedPlayer.style.setProperty('display', 'none', 'important');
          }
        }
      }
    } catch (error) {
      console.error('PetroleoTemplate: Error checking TV availability:', error);
    }
  }

  // Cargar todo el contenido - todas las secciones se cargan en la página principal
  async loadAllContent() {
    try {
      await this.loadAllNewsSections();
      await this.loadAllProgramsSections();
      await this.loadRecentTracks();
      await this.loadAllSponsorsSections();

      await Promise.all([
        this.loadAllGalleries(),
        this.loadAllAnnouncers(),
        this.loadAllPolls(),
        this.loadAllEvents(),
        this.loadAllVideos(),
        this.loadAllPodcasts(),
        this.loadAllVideocasts(),
        this.loadSocialNetworks()
      ]);
    } catch (error) {
      console.error('PetroleoTemplate: Error loading content:', error);
    }
  }

  // Cargar todas las secciones de noticias con UNA sola llamada a la API
  async loadAllNewsSections() {
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNews(1, 20);
      if (!news || !news.data || news.data.length === 0) {
        const hero = document.getElementById('hero-carousel');
        if (hero) hero.style.display = 'none';
        const ticker = document.getElementById('breaking-ticker');
        if (ticker) ticker.style.display = 'none';
        const featured = document.getElementById('featured-news-grid');
        if (featured) featured.style.display = 'none';
        return;
      }
      for (const item of news.data) {
        if (item.imageUrl) item.imageUrl = await dataManager.getImageUrl(item.imageUrl);
      }
      this.renderHeroCarousel(news.data.slice(0, 5));
      this.renderBreakingNews(news.data.slice(0, 3));
      this.renderFeaturedNews(news.data.slice(0, 6));
    } catch (error) {
      console.error('PetroleoTemplate: Error loading news sections:', error);
    }
  }

  // Cargar programas con UNA sola llamada a la API
  async loadAllProgramsSections() {
    try {
      const dataManager = getDataManager();
      const programs = await dataManager.loadPrograms();
      if (!programs || programs.length === 0) {
        this.toggleSectionVisibility('programs', false);
        return;
      }
      for (const program of programs) {
        if (program.imageUrl) program.imageUrl = await dataManager.getImageUrl(program.imageUrl);
      }
      this.renderProgramsByDay(programs);
      this.toggleSectionVisibility('programs', true);
    } catch (error) {
      console.error('PetroleoTemplate: Error loading programs sections:', error);
      this.toggleSectionVisibility('programs', false);
    }
  }

  // Cargar sponsors con UNA sola llamada a la API
  async loadAllSponsorsSections() {
    try {
      const dataManager = getDataManager();
      const sponsors = await dataManager.loadSponsors();
      if (!sponsors || sponsors.length === 0) {
        const carousel = document.getElementById('sponsors-carousel');
        if (carousel) carousel.style.display = 'none';
        this.toggleSectionVisibility('sponsors', false);
        return;
      }
      for (const sponsor of sponsors) {
        if (sponsor.logoUrl) sponsor.logoUrl = await dataManager.getImageUrl(sponsor.logoUrl);
      }
      this.renderSponsorsCarousel(sponsors);
      this.renderAllSponsors(sponsors);
      this.toggleSectionVisibility('sponsors', true);
    } catch (error) {
      console.error('PetroleoTemplate: Error loading sponsors sections:', error);
      const carousel = document.getElementById('sponsors-carousel');
      if (carousel) carousel.style.display = 'none';
      this.toggleSectionVisibility('sponsors', false);
    }
  }

  // Cargar hero carousel
  async loadHeroCarousel() {
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNews(1, 5);

      if (news.data && news.data.length > 0) {
        for (const item of news.data) {
          if (item.imageUrl) {
            item.imageUrl = await dataManager.getImageUrl(item.imageUrl);
          }
        }
        this.renderHeroCarousel(news.data);
      }
      const container = document.getElementById('hero-carousel');
      if (container && (!news.data || news.data.length === 0)) {
        container.style.display = 'none';
      }
    } catch (error) {
      console.error('PetroleoTemplate: Error loading hero carousel:', error);
      const container = document.getElementById('hero-carousel');
      if (container) container.style.display = 'none';
    }
  }

  renderHeroCarousel(news) {
    const container = document.getElementById('hero-carousel');
    if (!container) return;
    container.style.display = '';

    const slidesHtml = news.map((item, index) => `
      <div class="swiper-slide" data-index="${index}">
        <div class="hero-slide" style="background-image: url('${item.imageUrl || ''}')">
          <div class="hero-overlay"></div>
          <div class="hero-content">
            <span class="hero-category">Noticia</span>
            <h2 class="hero-title">${item.name}</h2>
            <p class="hero-description">${item.shortText || ''}</p>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = slidesHtml;
  }

  // Cargar noticias destacadas
  async loadFeaturedNews() {
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNews(1, 6);

      if (news.data && news.data.length > 0) {
        for (const item of news.data) {
          if (item.imageUrl) {
            item.imageUrl = await dataManager.getImageUrl(item.imageUrl);
          }
        }
        this.renderFeaturedNews(news.data);
      }
      const container = document.getElementById('featured-news-grid');
      if (container && (!news.data || news.data.length === 0)) {
        container.style.display = 'none';
      }
    } catch (error) {
      console.error('PetroleoTemplate: Error loading featured news:', error);
      const container = document.getElementById('featured-news-grid');
      if (container) container.style.display = 'none';
    }
  }

  renderFeaturedNews(news) {
    const container = document.getElementById('featured-news-grid');
    if (!container) return;
    container.style.display = '';

    const newsHtml = news.map(item => `
      <article class="news-card" data-slug="${item.slug}" style="background: rgba(255,255,255,0.1); padding: 20px; margin: 10px 0; border-radius: 10px; cursor: pointer;">
        <div class="news-image">
          <img src="${item.imageUrl || '/assets/images/default-news.jpg'}" alt="${item.name}" loading="lazy" style="width:100%;height:200px;object-fit:cover;">
        </div>
        <div class="news-content">
          <h3 class="news-title" data-slug="${item.slug}">${item.name}</h3>
          <p class="news-excerpt">${item.shortText || ''}</p>
        </div>
      </article>
    `).join('');

    container.innerHTML = newsHtml;
  }

  // Cargar breaking news
  async loadBreakingNews() {
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNews(1, 5);
      if (news && news.data && news.data.length > 0) {
        this.renderBreakingNews(news.data);
      }
      const container = document.getElementById('breaking-ticker');
      if (container && (!news || !news.data || news.data.length === 0)) {
        container.style.display = 'none';
      }
    } catch (error) {
      console.error('PetroleoTemplate: Error loading breaking news:', error);
      const container = document.getElementById('breaking-ticker');
      if (container) container.style.display = 'none';
    }
  }

  renderBreakingNews(news) {
    const container = document.getElementById('breaking-ticker');
    if (!container) return;
    container.style.display = '';

    container.innerHTML = news.map(item => `
      <span class="ticker-item">
        <span class="ticker-badge">ÚLTIMA HORA</span>
        <span class="ticker-text">${item.name}</span>
      </span>
    `).join('');
  }

  async loadProgramsByDay() {
    try {
      const dataManager = getDataManager();
      const programs = await dataManager.loadPrograms();
      if (programs && programs.length > 0) {
        for (const program of programs) {
          if (program.imageUrl) {
            program.imageUrl = await dataManager.getImageUrl(program.imageUrl);
          }
        }
        this.renderProgramsByDay(programs);
      }
      this.toggleSectionVisibility('programs', programs && programs.length > 0);
    } catch (error) {
      console.error('PetroleoTemplate: Error loading programs by day:', error);
      this.toggleSectionVisibility('programs', false);
    }
  }

  renderProgramsByDay(programs) {
    this._programs = programs;
    this._selectedDay = this._selectedDay || this._getTodayDayId();
    this.renderDaySchedule(this._selectedDay);
    this.setupDayButtons();
  }

  setupDayButtons() {
    document.querySelectorAll('.day-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const day = btn.dataset.day;
        if (!day || day === this._selectedDay) return;
        document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._selectedDay = day;
        this.renderDaySchedule(day);
      });
    });
    const activeBtn = document.querySelector(`.day-btn[data-day="${this._selectedDay}"]`);
    if (activeBtn) activeBtn.classList.add('active');
  }

  _getTodayDayId() {
    const map = { 0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes', 6: 'sabado' };
    return map[new Date().getDay()];
  }

  renderDaySchedule(dayId) {
    const container = document.getElementById('day-schedule-container');
    if (!container) return;

    const dayNames = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };
    const dayName = dayNames[dayId] || dayId;

    const dayPrograms = (this._programs || []).filter(p =>
      p.weekDays && p.weekDays.some(d => {
        const pd = this.getSpanishDay(d);
        return pd && pd.toLowerCase() === dayName.toLowerCase();
      })
    );

    if (dayPrograms.length === 0) {
      container.innerHTML = `<p style="text-align:center;color:#aaa;padding:40px 0;">No hay programación para el ${dayName}</p>`;
      return;
    }

    dayPrograms.sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));

    container.innerHTML = dayPrograms.map(program => `
      <div class="program-card-day" style="padding:15px;margin:12px 0;background:rgba(255,255,255,0.05);border-radius:10px;border-left:3px solid #e74c3c;display:flex;gap:15px;align-items:flex-start;">
        ${program.imageUrl ? `<div class="program-image" style="flex-shrink:0;width:80px;height:80px;border-radius:8px;overflow:hidden;"><img src="${program.imageUrl}" alt="${program.name}" style="width:100%;height:100%;object-fit:cover;"></div>` : ''}
        <div style="flex:1;">
          <div style="color:#e74c3c;font-weight:bold;font-size:0.9rem;">${program.startTime || ''} ${program.endTime ? '- ' + program.endTime : ''}</div>
          <div style="color:#fff;font-weight:600;margin-top:6px;font-size:1.1rem;">${program.name}</div>
          ${program.description ? `<div style="color:#aaa;font-size:0.85rem;margin-top:6px;line-height:1.5;">${program.description}</div>` : ''}
          ${program.host ? `<div style="color:#888;font-size:0.8rem;margin-top:4px;"><i class="fas fa-user"></i> ${program.host}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  // Cargar sponsors
  async loadSponsorsCarousel() {
    try {
      const dataManager = getDataManager();
      const sponsors = await dataManager.loadSponsors();

      if (sponsors && sponsors.length > 0) {
        for (const sponsor of sponsors) {
          if (sponsor.logoUrl) {
            sponsor.logoUrl = await dataManager.getImageUrl(sponsor.logoUrl);
          }
        }
        this.renderSponsorsCarousel(sponsors);
      }
      const container = document.getElementById('sponsors-carousel');
      if (container && (!sponsors || sponsors.length === 0)) {
        container.style.display = 'none';
      }
    } catch (error) {
      console.error('PetroleoTemplate: Error loading sponsors:', error);
      const container = document.getElementById('sponsors-carousel');
      if (container) container.style.display = 'none';
    }
  }

  renderSponsorsCarousel(sponsors) {
    const container = document.getElementById('sponsors-carousel');
    if (!container) return;
    container.style.display = '';

    const socialIcons = { facebook: 'fab fa-facebook-f', youtube: 'fab fa-youtube', instagram: 'fab fa-instagram', tiktok: 'fab fa-tiktok', whatsapp: 'fab fa-whatsapp', x: 'fab fa-x-twitter' };

    const sponsorsHtml = sponsors.map(sponsor => {
      const socialLinks = Object.entries(socialIcons)
        .filter(([key]) => sponsor[key])
        .map(([key, icon]) => `<a href="${sponsor[key]}" target="_blank" rel="noopener" class="sponsor-social-link"><i class="${icon}"></i></a>`)
        .join('');

      return `
      <div class="swiper-slide">
        <div class="sponsor-card">
          <div class="sponsor-card-header">
            <img src="${sponsor.logoUrl || '/assets/icons/icon-96x96.png'}" alt="${sponsor.name}">
            <h3>${sponsor.name}</h3>
          </div>
          ${sponsor.description ? `<p class="sponsor-description">${sponsor.description}</p>` : ''}
          ${sponsor.address ? `<p class="sponsor-address"><i class="fas fa-map-marker-alt"></i> ${sponsor.address}</p>` : ''}
          ${sponsor.website ? `<a href="${sponsor.website}" target="_blank" rel="noopener" class="sponsor-website"><i class="fas fa-globe"></i> ${sponsor.website}</a>` : ''}
          ${socialLinks ? `<div class="sponsor-social-links">${socialLinks}</div>` : ''}
        </div>
      </div>`;
    }).join('');

    container.innerHTML = sponsorsHtml;
  }

  async loadAllSponsors() {
    try {
      const dataManager = getDataManager();
      const sponsors = await dataManager.loadSponsors();
      if (sponsors && sponsors.length > 0) {
        for (const item of sponsors) {
          if (item.logoUrl) item.logoUrl = await dataManager.getImageUrl(item.logoUrl);
        }
        this.renderAllSponsors(sponsors);
      }
      this.toggleSectionVisibility('sponsors', sponsors && sponsors.length > 0);
    } catch (error) {
      console.error('PetroleoTemplate: Error loading all sponsors:', error);
      this.toggleSectionVisibility('sponsors', false);
    }
  }

  renderAllSponsors(sponsors) {
    const container = document.getElementById('all-sponsors-grid');
    if (!container) return;

    const socialIcons = { facebook: 'fab fa-facebook-f', youtube: 'fab fa-youtube', instagram: 'fab fa-instagram', tiktok: 'fab fa-tiktok', whatsapp: 'fab fa-whatsapp', x: 'fab fa-x-twitter' };

    const sponsorsHtml = sponsors.map(sponsor => {
      const socialLinks = Object.entries(socialIcons)
        .filter(([key]) => sponsor[key])
        .map(([key, icon]) => `<a href="${sponsor[key]}" target="_blank" rel="noopener" class="sponsor-social-link"><i class="${icon}"></i></a>`)
        .join('');

      return `
      <div class="sponsor-card">
        <div class="sponsor-card-header">
          <img src="${sponsor.logoUrl || '/assets/icons/icon-96x96.png'}" alt="${sponsor.name}">
          <h3>${sponsor.name}</h3>
        </div>
        ${sponsor.description ? `<p class="sponsor-description">${sponsor.description}</p>` : ''}
        ${sponsor.address ? `<p class="sponsor-address"><i class="fas fa-map-marker-alt"></i> ${sponsor.address}</p>` : ''}
        ${sponsor.website ? `<a href="${sponsor.website}" target="_blank" rel="noopener" class="sponsor-website"><i class="fas fa-globe"></i> ${sponsor.website}</a>` : ''}
        ${socialLinks ? `<div class="sponsor-social-links">${socialLinks}</div>` : ''}
      </div>`;
    }).join('');

    container.innerHTML = sponsorsHtml;
  }

  // Cargar tracks recientes
  async loadRecentTracks() {
    const container = document.getElementById('recent-tracks');
    if (!container) return;

    if (!this.currentSongData || !this.currentSongData.history) {
      container.style.display = 'none';
      return;
    }
    container.style.display = '';

    const history = this.currentSongData.history.slice(-5);
    const tracksHtml = history.map((track, index) => {
      const cleanTrack = track.replace(/^\d+\.\s*/, '');
      return `
        <div class="track-item">
          <span class="track-number">${index + 1}</span>
          <span class="track-name">${cleanTrack}</span>
        </div>
      `;
    }).join('');

    container.innerHTML = tracksHtml;
  }

  // ==========================================
  // GALERÍAS
  // ==========================================

  renderGalleryHtml(galleries) {
    return galleries.map(g => {
      const title = g.title || g.name || '';
      const desc = g.description || '';
      const count = (g.images || []).length;
      return `
      <div class="gallery-card" data-gallery-id="${g.id}" style="cursor:pointer;">
        <div class="gallery-card-image">
          <img src="${g._coverUrl || '/assets/icons/icon-96x96.png'}" alt="${title}" loading="lazy">
          <div class="gallery-card-overlay">
            <i class="fas fa-images"></i>
            <span>${count} fotos</span>
          </div>
        </div>
        <div class="gallery-card-info">
          <h3>${title}</h3>
          ${desc ? '<p>' + desc + '</p>' : ''}
        </div>
      </div>`;
    }).join('');
  }

  async loadAllGalleries(append) {
    try {
      const dm = getDataManager();
      const galleries = await dm.loadGalleries();

      if (!galleries || galleries.length === 0) {
        this.toggleSectionVisibility('galleries', false);
        return;
      }
      this.toggleSectionVisibility('galleries', true);

      const container = document.getElementById('galleries-grid');
      if (!container) return;

      for (const g of galleries) {
        const cover = (g.images && g.images.length) ? g.images[0].imageUrl : null;
        g._coverUrl = cover ? await dm.getImageUrl(cover) : null;
      }

      const html = this.renderGalleryHtml(galleries);
      if (append) {
        container.insertAdjacentHTML('beforeend', html);
      } else {
        container.innerHTML = html;
        this.renderLoadMoreButton(container, 'galleries', galleries.length >= 10);
      }
    } catch (error) {
      console.error('PetroleoTemplate: Error loading galleries:', error);
      this.toggleSectionVisibility('galleries', false);
    }
  }

  async openGalleryModal(id) {
    try {
      const dm = getDataManager();
      const galleries = await dm.loadGalleries();
      const gallery = (galleries || []).find(g => g.id === id);
      if (!gallery || !gallery.images || gallery.images.length === 0) return;

      for (const img of gallery.images) {
        if (img.imageUrl) img.imageUrl = await dm.getImageUrl(img.imageUrl);
      }

      this.currentGalleryImages = gallery.images.sort((a, b) => (a.order || 0) - (b.order || 0));
      this.currentGalleryIndex = 0;

      const modal = document.getElementById('gallery-modal');
      const titleEl = document.getElementById('gallery-modal-title');
      const mainImg = document.getElementById('gallery-main-img');
      const thumbs = document.getElementById('gallery-thumbnails');

      if (titleEl) titleEl.textContent = gallery.title || gallery.name || '';
      if (mainImg && this.currentGalleryImages[0]) {
        mainImg.src = this.currentGalleryImages[0].imageUrl;
      }
      if (thumbs) {
        thumbs.innerHTML = this.currentGalleryImages.map((img, i) => {
          const activeClass = i === 0 ? ' active' : '';
          return '<img src="' + img.imageUrl + '" class="gallery-thumb' + activeClass + '" data-index="' + i + '" loading="lazy">';
        }).join('');
      }
      if (modal) modal.classList.add('active');
    } catch (error) {
      console.error('PetroleoTemplate: Error opening gallery:', error);
    }
  }

  closeGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    if (modal) modal.classList.remove('active');
    this.currentGalleryImages = null;
    this.currentGalleryIndex = 0;
  }

  showGalleryImage(index) {
    if (!this.currentGalleryImages || index < 0 || index >= this.currentGalleryImages.length) return;
    this.currentGalleryIndex = index;
    const mainImg = document.getElementById('gallery-main-img');
    const thumbs = document.querySelectorAll('.gallery-thumb');
    if (mainImg) mainImg.src = this.currentGalleryImages[index].imageUrl;
    thumbs.forEach((t, i) => t.classList.toggle('active', i === index));
  }

  // ==========================================
  // LOCUTORES
  // ==========================================

  async loadAllAnnouncers() {
    try {
      const dm = getDataManager();
      const announcers = await dm.loadAnnouncers();

      if (!announcers || announcers.length === 0) {
        this.toggleSectionVisibility('announcers', false);
        return;
      }
      this.toggleSectionVisibility('announcers', true);

      const container = document.getElementById('announcers-grid');
      if (!container) return;

      for (const a of announcers) {
        if (a.imageUrl) a.imageUrl = await dm.getImageUrl(a.imageUrl);
      }

      container.innerHTML = announcers.map(a => {
        const bio = a.description || a.biography || a.bio || a.about || '';
        const bioHtml = bio ? '<p>' + bio + '</p>' : '';
        return `
        <div class="announcer-card">
          <div class="announcer-photo">
            <img src="${a.imageUrl || '/assets/icons/icon-96x96.png'}" alt="${a.name}" loading="lazy">
          </div>
          <h3>${a.name}</h3>
          ${bioHtml}
        </div>`;
      }).join('');
    } catch (error) {
      console.error('PetroleoTemplate: Error loading announcers:', error);
      this.toggleSectionVisibility('announcers', false);
    }
  }

  // ==========================================
  // ENCUESTAS
  // ==========================================

  async loadAllPolls() {
    try {
      const dm = getDataManager();
      const raw = await dm.loadPolls();
      const polls = Array.isArray(raw) ? raw : (raw && raw.data ? raw.data : []);

      const activePolls = (polls || []).filter(p => p.active);
      if (activePolls.length === 0) {
        this.toggleSectionVisibility('polls', false);
        return;
      }
      this.toggleSectionVisibility('polls', true);

      const container = document.getElementById('polls-container');
      if (!container) return;

      container.innerHTML = activePolls.map(poll => {
        const question = poll.title || poll.question || poll.name || poll.text || '';
        const optionsHtml = (poll.options || []).map(opt => {
          const label = opt.text || opt.name || opt.label || '';
          return '<button class="poll-option" data-poll-id="' + poll.id + '" data-option-id="' + opt.id + '"><span class="poll-option-text">' + label + '</span><span class="poll-bar" style="width: 0%"></span><span class="poll-count">' + (opt.votes || 0) + '</span></button>';
        }).join('');
        return '<div class="poll-card" data-poll-id="' + poll.id + '"><h3 class="poll-question">' + question + '</h3><div class="poll-options">' + optionsHtml + '</div><p class="poll-voted-msg" style="display:none;color:#bdc3c7;margin-top:0.75rem;font-weight:600;"><i class="fas fa-check-circle"></i> ¡Gracias por votar!</p></div>';
      }).join('');
    } catch (error) {
      console.error('PetroleoTemplate: Error loading polls:', error);
      this.toggleSectionVisibility('polls', false);
    }
  }

  async handleVote(pollId, optionId) {
    const dm = getDataManager();
    try {
      const voteResult = await dm.votePoll(pollId, optionId);
      const poll = voteResult && voteResult.options ? voteResult : null;

      if (!poll) {
        const polls = await dm.loadPolls(true);
        const found = (polls || []).find(p => p.id === pollId);
        if (!found) return;
      }

      const updatedPoll = poll || (await dm.loadPolls(true)).find(p => p.id === pollId);
      if (!updatedPoll) return;

      const total = (updatedPoll.options || []).reduce((sum, o) => sum + (o.votes || 0), 0);
      const card = document.querySelector('.poll-card[data-poll-id="' + pollId + '"]');
      if (!card) return;

      const optionBtns = card.querySelectorAll('.poll-option');
      optionBtns.forEach((btn, i) => {
        const opt = (updatedPoll.options || [])[i];
        if (!opt) return;
        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
        btn.querySelector('.poll-bar').style.width = pct + '%';
        const countEl = btn.querySelector('.poll-count');
        if (countEl) countEl.textContent = opt.votes + ' (' + pct + '%)';
        btn.disabled = true;
      });

      const msg = card.querySelector('.poll-voted-msg');
      if (msg) msg.style.display = 'block';
    } catch (error) {
      console.error('PetroleoTemplate: Error voting:', error);
      alert('Error al registrar tu voto. Intenta de nuevo.');
    }
  }

  // ==========================================
  // EVENTOS
  // ==========================================

  renderEventHtml(e) {
    const title = e.name || e.title || e.text || '';
    const desc = e.description || e.shortText || '';
    const imgUrl = e.imageUrl || '';
    const eventDate = e.date ? new Date(e.date) : null;
    const day = eventDate ? eventDate.getDate() : '?';
    const month = eventDate ? eventDate.toLocaleDateString('es-ES', { month: 'short' }) : '';
    const imageHtml = imgUrl ? '<div class="event-image"><img src="' + imgUrl + '" alt="' + title + '" loading="lazy"></div>' : '';
    const descHtml = desc ? '<p>' + desc + '</p>' : '';
    const timeHtml = e.time ? '<span><i class="fas fa-clock"></i> ' + e.time + '</span>' : '';
    const locationHtml = e.location ? '<span><i class="fas fa-map-marker-alt"></i> ' + e.location + '</span>' : '';
    return '<div class="event-card">' + imageHtml + '<div class="event-card-body"><div class="event-date-badge"><span class="event-day">' + day + '</span><span class="event-month">' + month + '</span></div><div class="event-card-info"><h3>' + title + '</h3>' + descHtml + '<div class="event-meta">' + timeHtml + locationHtml + '</div></div></div></div>';
  }

  async loadAllEvents(append) {
    try {
      const dm = getDataManager();
      const events = await dm.loadEvents();

      if (!events || events.length === 0) {
        this.toggleSectionVisibility('events', false);
        return;
      }
      this.toggleSectionVisibility('events', true);

      const container = document.getElementById('events-timeline');
      if (!container) return;

      for (const e of events) {
        if (e.imageUrl) e.imageUrl = await dm.getImageUrl(e.imageUrl);
      }

      const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
      const itemsHtml = sorted.map(e => this.renderEventHtml(e)).join('');

      if (append) {
        container.insertAdjacentHTML('beforeend', itemsHtml);
      } else {
        container.innerHTML = itemsHtml;
        this.renderLoadMoreButton(container, 'events', events.length >= 10);
      }
    } catch (error) {
      console.error('PetroleoTemplate: Error loading events:', error);
      this.toggleSectionVisibility('events', false);
    }
  }

  // ==========================================
  // VIDEOS
  // ==========================================

  async loadAllVideos() {
    try {
      const dm = getDataManager();
      const videos = await dm.loadVideos();

      const items = videos.data || videos;
      if (!items || items.length === 0) {
        this.toggleSectionVisibility('videos', false);
        return;
      }
      this.toggleSectionVisibility('videos', true);

      const container = document.getElementById('videos-grid');
      if (!container) return;

      const youtubeThumb = (url) => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
        return match ? 'https://img.youtube.com/vi/' + match[1] + '/mqdefault.jpg' : '/assets/icons/icon-96x96.png';
      };

      container.innerHTML = items.map((video, i) => {
        const title = video.name || video.title || '';
        const desc = video.description || video.shortText || '';
        return '<a href="' + (video.videoUrl || '#') + '" target="_blank" rel="noopener" class="video-card glass-effect" style="display:flex;gap:1rem;padding:1rem;align-items:center;cursor:pointer;text-decoration:none;color:inherit;margin-bottom:0.75rem;"><img src="' + youtubeThumb(video.videoUrl) + '" alt="' + title + '" style="width:120px;height:90px;object-fit:cover;border-radius:8px;flex-shrink:0;"><div style="flex:1;"><h4 style="margin:0 0 0.25rem;">' + title + '</h4><p style="margin:0;color:#b3b3b3;font-size:0.85rem;">' + desc + '</p></div><i class="fas fa-play-circle" style="font-size:2rem;color:#bdc3c7;flex-shrink:0;"></i></a>';
      }).join('');
    } catch (error) {
      console.error('PetroleoTemplate: Error loading videos:', error);
      this.toggleSectionVisibility('videos', false);
    }
  }

  // ==========================================
  // REDES SOCIALES
  // ==========================================

  async loadSocialNetworks() {
    try {
      await super.loadSocialNetworks();
      const dm = getDataManager();
      const socialData = await dm.loadSocialNetworks();

      if (!socialData || Object.keys(socialData).length === 0) {
        this.toggleSectionVisibility('social', false);
        return;
      }

      const iconMap = {
        facebook: 'fab fa-facebook-f',
        x: 'fab fa-x-twitter',
        twitter: 'fab fa-twitter',
        instagram: 'fab fa-instagram',
        youtube: 'fab fa-youtube',
        tiktok: 'fab fa-tiktok',
        whatsapp: 'fab fa-whatsapp',
        telegram: 'fab fa-telegram',
        linkedin: 'fab fa-linkedin-in'
      };

      const entries = [
        { name: 'facebook', url: socialData.facebook },
        { name: 'instagram', url: socialData.instagram },
        { name: 'twitter', url: socialData.x || socialData.twitter },
        { name: 'youtube', url: socialData.youtube },
        { name: 'tiktok', url: socialData.tiktok },
        { name: 'whatsapp', url: socialData.whatsapp && socialData.whatsapp.startsWith('http') ? socialData.whatsapp : 'https://wa.me/' + ((socialData.whatsapp || '').replace(/[^0-9]/g, '')) },
        { name: 'telegram', url: socialData.telegram },
        { name: 'linkedin', url: socialData.linkedin }
      ].filter(e => e.url);

      if (entries.length === 0) {
        this.toggleSectionVisibility('social', false);
        return;
      }
      this.toggleSectionVisibility('social', true);

      const socialHtml = entries.map(item => {
        const icon = iconMap[item.name] || 'fas fa-link';
        const label = item.name.charAt(0).toUpperCase() + item.name.slice(1);
        return '<a href="' + item.url + '" target="_blank" rel="noopener" class="social-link-item"><i class="' + icon + '"></i><span>' + label + '</span></a>';
      }).join('');

      const socialHub = document.getElementById('social-hub');
      if (socialHub) socialHub.innerHTML = socialHtml;
    } catch (error) {
      console.error('PetroleoTemplate: Error loading social networks:', error);
      this.toggleSectionVisibility('social', false);
    }
  }

  // Sobrescribir: Cuando se carga la canción actual
  onCurrentSongLoaded(songData) {
    console.log('PetroleoTemplate: onCurrentSongLoaded called', songData);

    // Update sidebar listeners
    const listenersEl = document.getElementById('sidebar-listeners');
    if (listenersEl) {
      listenersEl.textContent = songData.listeners || '0';
    }

    // Update recent tracks
    const tracksEl = document.getElementById('recent-tracks');
    if (!tracksEl) return;
    if (songData && songData.history) {
      tracksEl.style.display = '';
      const tracksHtml = songData.history.slice(-5).map((track, i) => {
        const cleanTrack = track.replace(/^\d+\.\s*/, '').replace(/<br>$/, '');
        return `<div class="track-item" style="padding:8px;"><span style="color:#e74c3c;">${i+1}.</span> <span>${cleanTrack}</span></div>`;
      }).join('');
      tracksEl.innerHTML = tracksHtml;
    } else {
      tracksEl.style.display = 'none';
    }

    // Setup news click handlers
    this.setupNewsClickHandlers();
  }

  // Setup click handlers for news items
  setupNewsClickHandlers() {
    document.addEventListener('click', async (e) => {
      const newsLink = e.target.closest('[data-slug]');
      if (newsLink) {
        e.preventDefault();
        const slug = newsLink.getAttribute('data-slug');
        await this.openNewsModal(slug);
      }
    });
  }

  // Open news modal
  async openNewsModal(slug) {
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNewsBySlug(slug);

      if (news) {
        // Update modal content
        const titleEl = document.getElementById('news-modal-title');
        const dateEl = document.getElementById('news-modal-date');
        const contentEl = document.getElementById('news-modal-content');
        const imageEl = document.getElementById('news-modal-image');

        if (titleEl) titleEl.textContent = news.name || '';
        if (dateEl) dateEl.innerHTML = `<i class="fas fa-calendar"></i> ${new Date(news.createdAt).toLocaleDateString('es-ES')}`;
        if (contentEl) contentEl.innerHTML = news.description || news.shortText || '';

        if (imageEl && news.imageUrl) {
          const fullImageUrl = await dataManager.getImageUrl(news.imageUrl);
          imageEl.src = fullImageUrl;
          imageEl.parentElement.style.display = 'block';
        } else if (imageEl) {
          imageEl.parentElement.style.display = 'none';
        }

        // Show modal
        const modal = document.getElementById('news-modal');
        if (modal) {
          modal.classList.add('active');
        }
      }
    } catch (error) {
      console.error('PetroleoTemplate: Error loading news details:', error);
    }
  }

  // Open modal helper
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  }

  // Close modal helper
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  }

  // Setup modal close handlers
  setupModalHandlers() {
    // Close button handlers
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.modal-overlay').classList.remove('active');
      });
    });

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
          modal.classList.remove('active');
        });
      }
    });

    // Share buttons
    document.querySelectorAll('.share-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = window.location.href;
        if (navigator.share) {
          navigator.share({ url });
        } else {
          navigator.clipboard.writeText(url);
          alert('Enlace copiado al portapapeles');
        }
      });
    });

    // Gallery and poll interactions via delegation
    document.addEventListener('click', (e) => {
      const galleryCard = e.target.closest('[data-gallery-id]');
      if (galleryCard) {
        e.preventDefault();
        this.openGalleryModal(galleryCard.getAttribute('data-gallery-id'));
        return;
      }

      const galleryThumb = e.target.closest('.gallery-thumb');
      if (galleryThumb) {
        e.preventDefault();
        const index = parseInt(galleryThumb.dataset.index);
        if (!isNaN(index)) this.showGalleryImage(index);
        return;
      }

      const galleryPrev = e.target.closest('.gallery-prev');
      if (galleryPrev) {
        e.preventDefault();
        this.showGalleryImage(this.currentGalleryIndex - 1);
        return;
      }

      const galleryNext = e.target.closest('.gallery-next');
      if (galleryNext) {
        e.preventDefault();
        this.showGalleryImage(this.currentGalleryIndex + 1);
        return;
      }

      const pollOption = e.target.closest('.poll-option');
      if (pollOption && !pollOption.disabled) {
        e.preventDefault();
        this.handleVote(pollOption.dataset.pollId, pollOption.dataset.optionId);
        return;
      }

      const podcastCard = e.target.closest('[data-podcast-id]');
      if (podcastCard) {
        e.preventDefault();
        this.openPodcastModal(podcastCard.dataset.podcastId);
        return;
      }

      const videocastCard = e.target.closest('[data-videocast-id]');
      if (videocastCard) {
        e.preventDefault();
        this.openVideocastModal(videocastCard.dataset.videocastId);
        return;
      }

      const podcastClose = e.target.closest('#podcast-modal .modal-close');
      if (podcastClose) {
        this.closePodcastModal();
        return;
      }

      const podcastOverlay = e.target.closest('#podcast-modal');
      if (podcastOverlay && e.target === podcastOverlay) {
        this.closePodcastModal();
        return;
      }

      const videocastClose = e.target.closest('#videocast-modal .modal-close');
      if (videocastClose) {
        this.closeVideocastModal();
        return;
      }

      const videocastOverlay = e.target.closest('#videocast-modal');
      if (videocastOverlay && e.target === videocastOverlay) {
        this.closeVideocastModal();
        return;
      }
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

      if (img && data.coverUrl) {
        const dm = getDataManager();
        img.src = await dm.getImageUrl(data.coverUrl);
      } else if (img && data.logoUrl) {
        const dm = getDataManager();
        img.src = await dm.getImageUrl(data.logoUrl);
      }
      if (nameEl) nameEl.textContent = data.projectName || data.name || 'Nuestra Radio';
      if (descEl) descEl.textContent = data.projectDescription || data.description || 'Estamos aquí para escucharte.';
    } catch (err) {
      console.warn('PetroleoTemplate: Error populating contact cover:', err);
    }
  }

  // Setup de carouseles
  setupCarousels() {
    if (typeof Swiper === 'undefined') {
      console.warn('PetroleoTemplate: Swiper not available');
      return;
    }

    setTimeout(() => {
      const heroSlides = document.querySelectorAll('#hero-carousel .swiper-slide');
      const heroSwiperEl = document.querySelector('.hero-swiper');
      if (heroSwiperEl && heroSlides.length > 0 && !this.heroSwiper) {
        try {
          this.heroSwiper = new Swiper('.hero-swiper', {
            loop: true,
            autoplay: { delay: 5000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true }
          });
        } catch (error) {
          console.warn('PetroleoTemplate: Error initializing hero carousel:', error.message);
        }
      }

      const sponsorSlides = document.querySelectorAll('#sponsors-carousel .swiper-slide');
      const sponsorsSwiperEl = document.querySelector('.sponsors-swiper');
      if (sponsorsSwiperEl && sponsorSlides.length > 0 && !this.sponsorsSwiper) {
        try {
          this.sponsorsSwiper = new Swiper('.sponsors-swiper', {
            loop: true,
            autoplay: { delay: 3000, disableOnInteraction: false },
            slidesPerView: 'auto',
            spaceBetween: 30,
            pagination: { el: '.swiper-pagination', clickable: true }
          });
        } catch (error) {
          console.warn('PetroleoTemplate: Error initializing sponsors carousel:', error.message);
        }
      }
    }, 1000);
  }

  // ==========================================
  // PAGINACIÓN (Load More)
  // ==========================================

  renderLoadMoreButton(container, sectionName, hasMore) {
    const btnClass = `load-more-btn-${sectionName}`;
    const existing = document.querySelector(`.${btnClass}`);
    if (existing) existing.remove();
    if (!hasMore) return;
    const btn = document.createElement('button');
    btn.className = `load-more-btn glass-btn ${btnClass}`;
    btn.textContent = 'Cargar m\u00E1s';
    btn.addEventListener('click', () => this[`loadMore${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`]());
    container.after(btn);
  }

  async loadMoreGalleries() {
    this.currentPage.galleries++;
    await this.loadAllGalleries(true);
  }

  async loadMoreEvents() {
    this.currentPage.events++;
    await this.loadAllEvents(true);
  }

  async loadAllPodcasts() {
    try {
      const dm = getDataManager();
      const podcasts = await dm.loadPodcasts(1, 20);
      if (!podcasts.data || podcasts.data.length === 0) {
        this.toggleSectionVisibility('multimedia', false);
        return;
      }
      const container = document.getElementById('podcasts-grid');
      if (!container) return;
      for (const item of podcasts.data) {
        if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
      }
      container.innerHTML = podcasts.data.map(podcast => `
        <div class="media-card" data-podcast-id="${podcast.id}" style="cursor:pointer;">
          <div class="media-thumbnail">
            <img src="${podcast.imageUrl || '/assets/icons/icon-96x96.png'}" alt="${podcast.title || ''}" loading="lazy">
            <div class="media-overlay">
              <div class="play-btn"><i class="fas fa-play"></i></div>
            </div>
            ${podcast.duration ? '<span class="media-duration">' + podcast.duration + '</span>' : ''}
          </div>
          <div class="media-info" style="padding:15px;">
            <h4>${podcast.title || ''}</h4>
          </div>
        </div>
      `).join('');
      this.toggleSectionVisibility('multimedia', true);
    } catch (error) {
      console.error('PetroleoTemplate: Error loading podcasts:', error);
    }
  }

  async loadAllVideocasts() {
    try {
      const dm = getDataManager();
      const videocasts = await dm.loadVideocasts(1, 20);
      if (!videocasts.data || videocasts.data.length === 0) {
        this.toggleSectionVisibility('multimedia', false);
        return;
      }
      const container = document.getElementById('videocasts-grid');
      if (!container) return;
      for (const item of videocasts.data) {
        if (item.imageUrl) item.imageUrl = await dm.getImageUrl(item.imageUrl);
      }
      container.innerHTML = videocasts.data.map(videocast => `
        <div class="media-card" data-videocast-id="${videocast.id}" style="cursor:pointer;">
          <div class="media-thumbnail">
            <img src="${videocast.imageUrl || '/assets/icons/icon-96x96.png'}" alt="${videocast.title || ''}" loading="lazy">
            <div class="media-overlay">
              <div class="play-btn"><i class="fas fa-play"></i></div>
            </div>
            ${videocast.duration ? '<span class="media-duration">' + videocast.duration + '</span>' : ''}
          </div>
          <div class="media-info" style="padding:15px;">
            <h4>${videocast.title || ''}</h4>
          </div>
        </div>
      `).join('');
      this.toggleSectionVisibility('multimedia', true);
    } catch (error) {
      console.error('PetroleoTemplate: Error loading videocasts:', error);
    }
  }

  async openPodcastModal(id) {
    try {
      const dm = getDataManager();
      const data = await dm.loadPodcastById(id);
      if (!data) return;
      const modal = document.getElementById('podcast-modal');
      const imgEl = document.getElementById('podcast-modal-image');
      const titleEl = document.getElementById('podcast-modal-title');
      const descEl = document.getElementById('podcast-modal-description');
      const audioEl = document.getElementById('podcast-audio');
      const durationEl = document.getElementById('podcast-modal-duration');
      if (imgEl && data.imageUrl) {
        imgEl.src = await dm.getImageUrl(data.imageUrl);
        imgEl.parentElement.style.display = 'flex';
      } else if (imgEl) {
        imgEl.parentElement.style.display = 'none';
      }
      if (titleEl) titleEl.textContent = data.title || '';
      if (descEl) descEl.textContent = data.description || data.shortText || '';
      const audioUrl = data.audioUrl || data.fileUrl || data.url || data.audio || '';
      if (audioEl && audioUrl) {
        audioEl.src = audioUrl.startsWith('http') ? audioUrl : await dm.getImageUrl(audioUrl);
        audioEl.load();
      }
      if (durationEl) {
        const span = durationEl.querySelector('span');
        if (span) span.textContent = data.duration || '';
      }
      const playBtn = document.getElementById('podcast-play-btn');
      if (playBtn && audioEl) {
        playBtn.onclick = () => {
          if (audioEl.paused) {
            audioEl.play();
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
          } else {
            audioEl.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
          }
        };
        audioEl.onended = () => { playBtn.innerHTML = '<i class="fas fa-play"></i>'; };
        audioEl.onpause = () => { playBtn.innerHTML = '<i class="fas fa-play"></i>'; };
        audioEl.onplay = () => { playBtn.innerHTML = '<i class="fas fa-pause"></i>'; };
      }
      if (modal) modal.classList.add('active');
    } catch (error) {
      console.error('PetroleoTemplate: Error opening podcast:', error);
    }
  }

  closePodcastModal() {
    const modal = document.getElementById('podcast-modal');
    if (modal) modal.classList.remove('active');
    const audio = document.getElementById('podcast-audio');
    if (audio) {
      audio.pause();
      audio.src = '';
      audio.load();
    }
    const playBtn = document.getElementById('podcast-play-btn');
    if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i>';
  }

  async openVideocastModal(id) {
    try {
      const dm = getDataManager();
      const data = await dm.loadVideocastById(id);
      if (!data || !data.videoUrl) return;
      const modal = document.getElementById('videocast-modal');
      const titleEl = document.getElementById('videocast-modal-title');
      const descEl = document.getElementById('videocast-modal-description');
      const videoEl = document.getElementById('videocast-video');
      const durationEl = document.getElementById('videocast-modal-duration');
      if (titleEl) titleEl.textContent = data.title || '';
      if (descEl) descEl.textContent = data.description || data.shortText || '';
      if (durationEl) {
        const span = durationEl.querySelector('span');
        if (span) span.textContent = data.duration || '';
      }
      if (data.videoUrl.match(/youtube\.com|youtu\.be/i)) {
        if (videoEl) {
          videoEl.style.display = 'none';
          const playerContainer = videoEl.parentElement;
          let iframe = playerContainer.querySelector('.youtube-embed');
          if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.className = 'youtube-embed';
            iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:8px;';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            playerContainer.appendChild(iframe);
          }
          const match = data.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
          if (match) iframe.src = 'https://www.youtube.com/embed/' + match[1] + '?autoplay=1';
        }
        if (modal) modal.classList.add('active');
      } else {
        if (videoEl) {
          videoEl.style.display = '';
          const iframe = videoEl.parentElement.querySelector('.youtube-embed');
          if (iframe) iframe.src = '';
          const source = videoEl.querySelector('source');
          if (source) source.src = data.videoUrl;
          videoEl.load();
        }
        if (modal) modal.classList.add('active');
      }
    } catch (error) {
      console.error('PetroleoTemplate: Error opening videocast:', error);
    }
  }

  closeVideocastModal() {
    const modal = document.getElementById('videocast-modal');
    if (modal) modal.classList.remove('active');
    const video = document.getElementById('videocast-video');
    if (video) {
      video.pause();
      const source = video.querySelector('source');
      if (source) source.src = '';
      video.load();
      video.style.display = '';
    }
    const iframe = document.querySelector('.youtube-embed');
    if (iframe) iframe.src = '';
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.petroleoTemplate = new PetroleoTemplate();
    await window.petroleoTemplate.init();
  } catch (error) {
    console.error('PetroleoTemplate: Error creating instance:', error);
  }
});

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
  if (window.petroleoTemplate) {
    window.petroleoTemplate.destroy();
  }
});

export default PetroleoTemplate;
