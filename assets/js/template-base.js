/**
 * TemplateBase - Clase base para todos los templates
 * Centraliza toda la lógica común
 * Los templates específicos extienden esta clase y solo implementan renderizado
 */
import { getDataManager } from './data-manager.js';
import AudioPlayer from './audio-player.js';
import SocialManager from './social-manager.js';

class TemplateBase {
  constructor(options = {}) {
    this.dataManager = getDataManager();
    this.audioPlayer = new AudioPlayer({
      audioElementId: options.audioElementId || 'radio-audio',
      playButtonId: options.playButtonId || 'play-btn',
      volumeSliderId: options.volumeSliderId || 'volume-slider',
      defaultVolume: options.defaultVolume || 50,
      onPlay: () => this.onAudioPlay(),
      onPause: () => this.onAudioPause(),
      onError: (error) => this.onAudioError(error),
      onVolumeChange: (value) => this.onVolumeChange(value)
    });
    
    this.socialManager = new SocialManager({
      containerIds: options.socialContainerIds || ['social-links', 'footer-social']
    });

    this.isPlaying = false;
    this.currentVolume = options.defaultVolume || 50;
    this.sonicPanelInterval = null;
    this.currentSongData = null;
    this._radioCoverUrl = null;
    
    // IDs de elementos DOM que pueden variar entre templates
    this.domIds = {
      radioLogo: options.radioLogoId || 'radio-logo',
      footerRadioName: options.footerRadioNameId || 'footer-radio-name',
      trackTitle: options.trackTitleId || 'track-title',
      trackArtist: options.trackArtistId || 'track-artist',
      listenersCount: options.listenersCountId || 'listeners-count',
      audioQuality: options.audioQualityId || 'audio-quality',
      bitrate: options.bitrateId || 'bitrate',
      trackArtwork: options.trackArtworkId || 'track-artwork',
      defaultArtwork: options.defaultArtworkId || 'default-artwork',
      tvOnlineBtn: options.tvOnlineBtnId || 'tv-online-btn',
      ...options.customDomIds
    };
  }

  // Inicialización principal - todos los templates llaman a esto
  async init() {
    try {
      console.log('TemplateBase: Initializing...');
      
      // Cargar datos básicos
      await this.loadBasicData();

      // Configurar reproductor de audio
      this.audioPlayer.init();

      // Inicializar enhancer de audio (lazy, no bloquea LCP).
      // El enhancer escucha `vumeter:realanalysis` y se cablea solo
      // cuando el VU meter ya tiene el grafo de Web Audio armado.
      try {
        const { getAudioEnhancer } = await import('./audio-enhancer.js');
        await getAudioEnhancer().init({
          audioElement: this.audioPlayer.audioElement
        });
      } catch (e) {
        console.warn('TemplateBase: no se pudo cargar audio-enhancer', e);
      }

      // Cargar redes sociales
      await this.loadSocialNetworks();
      
      // Cargar datos de SonicPanel
      await this.loadSonicPanelData();
      
      // Iniciar actualizaciones periódicas
      this.startSonicPanelUpdates();
      
      // Configurar fecha actual
      this.setCurrentDate();
      
      // Inicializar animaciones
      this.setupAnimations();
      
      console.log('TemplateBase: Initialization complete');
    } catch (error) {
      console.error('TemplateBase: Error initializing:', error);
    }
  }

  // Cargar datos básicos (logo, nombre, URL streaming)
  async loadBasicData() {
    try {
      const data = await this.dataManager.loadBasicData();
      
      // Actualizar logo
      const logoElement = document.getElementById(this.domIds.radioLogo);
      if (logoElement && data.logoUrl) {
        const logoUrl = await this.dataManager.getImageUrl(data.logoUrl);
        logoElement.src = logoUrl;
        logoElement.style.display = 'block';
      }
      
      // Actualizar nombre en footer
      const nameElement = document.getElementById(this.domIds.footerRadioName);
      if (nameElement) {
        nameElement.textContent = data.projectName || 'Radio';
      }
      
      // Actualizar descripción en footer
      const descElement = document.getElementById('footer-description');
      if (descElement && data.projectDescription) {
        descElement.textContent = data.projectDescription;
      }
      
      // Almacenar URL del cover de la radio para fallback
      if (data.coverUrl) {
        this._radioCoverUrl = await this.dataManager.getImageUrl(data.coverUrl);
      } else if (data.logoUrl) {
        this._radioCoverUrl = await this.dataManager.getImageUrl(data.logoUrl);
      }

      if (this._radioCoverUrl) {
        const artworkEl = document.getElementById(this.domIds.trackArtwork);
        const defaultArtworkEl = document.getElementById(this.domIds.defaultArtwork);
        if (artworkEl && defaultArtworkEl) {
          artworkEl.src = this._radioCoverUrl;
          artworkEl.style.display = 'block';
          defaultArtworkEl.style.display = 'none';
        }
      }

      // Configurar URL del stream
      if (data.radioStreamingUrl) {
        this.audioPlayer.setStreamUrl(data.radioStreamingUrl);
      }
      
      // Actualizar título de la página
      document.title = data.projectName || 'Radio';
      
      // Notificar al template hijo
      this.onBasicDataLoaded(data);
      
    } catch (error) {
      console.error('TemplateBase: Error loading basic data:', error);
    }
  }

  // Cargar redes sociales
  async loadSocialNetworks() {
    try {
      const socialData = await this.dataManager.loadSocialNetworks();
      this.socialManager.loadSocialNetworks(socialData).render();
      this.onSocialNetworksLoaded(socialData);
    } catch (error) {
      console.error('TemplateBase: Error loading social networks:', error);
    }
  }

  // Cargar datos de SonicPanel (canción actual)
  async loadSonicPanelData() {
    try {
      const songData = await this.dataManager.loadCurrentSong();
      if (songData) {
        this.currentSongData = songData;
        this.updateCurrentSongDisplay(songData);
        this.onCurrentSongLoaded(songData);
      }
    } catch (error) {
      console.error('TemplateBase: Error loading SonicPanel data:', error);
    }
  }

  // Actualizar display con datos de la canción actual
  updateCurrentSongDisplay(songData) {
    console.log('TemplateBase: updateCurrentSongDisplay - songData:', songData);
    console.log('TemplateBase: domIds:', this.domIds);
    const titleEl = document.getElementById(this.domIds.trackTitle);
    const artistEl = document.getElementById(this.domIds.trackArtist);
    console.log('TemplateBase: titleEl:', titleEl, 'artistEl:', artistEl);
    const listenersEl = document.getElementById(this.domIds.listenersCount);
    const qualityEl = document.getElementById(this.domIds.audioQuality);
    const bitrateEl = document.getElementById(this.domIds.bitrate);
    const artworkEl = document.getElementById(this.domIds.trackArtwork);
    const defaultArtworkEl = document.getElementById(this.domIds.defaultArtwork);

    if (titleEl) {
      // Use title as primary
      titleEl.textContent = songData.title || 'Radio';
      console.log('TemplateBase: Set title to:', titleEl.textContent);
    }
    if (artistEl) {
      // Extract artist from fullTitle if it has "Artist - Title" format
      let artist = 'En Vivo';
      if (songData.fullTitle && songData.fullTitle.includes(' - ')) {
        const parts = songData.fullTitle.split(' - ');
        artist = parts[0].trim(); // Get artist name
      } else if (songData.djUsername) {
        artist = songData.djUsername;
      }
      artistEl.textContent = artist;
      console.log('TemplateBase: Set artist to:', artistEl.textContent);
    }
    if (listenersEl) listenersEl.textContent = songData.listeners || '0';
    if (qualityEl) qualityEl.textContent = songData.bitrate ? `${songData.bitrate}k` : 'HD';
    if (bitrateEl) bitrateEl.textContent = songData.bitrate || 'N/A';

    // Actualizar artwork con fallback al cover de la radio
    if (songData.art && artworkEl && defaultArtworkEl) {
      if (songData.art !== artworkEl.src) {
        const img = new Image();
        img.onload = () => {
          artworkEl.src = songData.art;
          artworkEl.style.display = 'block';
          defaultArtworkEl.style.display = 'none';
        };
        img.onerror = () => {
          if (this._radioCoverUrl) {
            artworkEl.src = this._radioCoverUrl;
            artworkEl.style.display = 'block';
            defaultArtworkEl.style.display = 'none';
          }
        };
        img.src = songData.art;
      }
    } else if (this._radioCoverUrl && artworkEl && defaultArtworkEl && artworkEl.src !== this._radioCoverUrl) {
      artworkEl.src = this._radioCoverUrl;
      artworkEl.style.display = 'block';
      defaultArtworkEl.style.display = 'none';
    }
  }

  // Iniciar actualizaciones periódicas de SonicPanel
  startSonicPanelUpdates(interval = 30000) {
    this.dataManager.startSonicPanelUpdates(interval);
    
    // Escuchar eventos de actualización
    this.dataManager.on('currentSongLoaded', (songData) => {
      this.currentSongData = songData;
      this.updateCurrentSongDisplay(songData);
      this.onCurrentSongLoaded(songData);
    });
  }

  // Detener actualizaciones
  stopSonicPanelUpdates() {
    this.dataManager.stopSonicPanelUpdates();
  }

  // Toggle audio (play/pause)
  toggleAudio() {
    this.audioPlayer.toggle();
  }

  // Eventos del reproductor de audio (sobrescribir en templates hijos)
  onAudioPlay() {
    this.isPlaying = true;
    this.updatePlayButton(true);
  }

  onAudioPause() {
    this.isPlaying = false;
    this.updatePlayButton(false);
  }

  onAudioError(error) {
    console.error('TemplateBase: Audio error:', error);
    this.isPlaying = false;
    this.updatePlayButton(false);
  }

  onVolumeChange(value) {
    // Sobrescribir en template hijo si es necesario
  }

  // Actualizar botón de play/pause
  updatePlayButton(isPlaying) {
    const playBtn = document.getElementById(this.audioPlayer.playButtonId);
    if (playBtn) {
      const icon = playBtn.querySelector('i');
      if (icon) {
        icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
      }
    }
  }

  // Establecer fecha actual
  setCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      dateElement.textContent = new Date().toLocaleDateString('es-ES', options);
    }
  }

  // ==========================================
  // MÉTODOS COMUNES - Centralizados en TemplateBase
  // ==========================================

  // Setup de navegación (menú hamburguesa)
  setupNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (menuToggle && navMenu) {
      menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });
      
      document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
          navMenu.classList.remove('active');
        }
      });
    }
  }

  // Setup de filtros
  setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.target.dataset.filter;
        this.currentFilter = filter;
        
        filterButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        this.applyFilter(filter);
      });
    });
  }

  // Aplicar filtro (sobrescribir en template hijo si es necesario)
  applyFilter(filter) {
    // Por defecto no hace nada, sobrescribir en template hijo
  }

  // Setup de tabs
  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this.showTab(tab);
      });
    });
  }

  // Mostrar tab
  showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const targetTab = document.getElementById(`${tabName}-tab`);
    const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (targetTab) targetTab.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');
    
    this.currentTab = tabName;
  }

  // Setup de modales
  setupModales() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modals.forEach(modal => modal.classList.remove('active'));
      }
    });
  }

  // Setup de animaciones (AOS)
  setupAnimations() {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        once: true,
        offset: 100
      });
    }
  }

  // Setup de ripple effects
  setupRippleEffects() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.ripple-btn')) {
        const btn = e.target.closest('.ripple-btn');
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        btn.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
      }
    });
  }

  // ==========================================
  // MÉTODOS PARA SOBRESCRIBIR EN TEMPLATES HIJOS
  // ==========================================
  onBasicDataLoaded(data) {
    // Template hijo puede sobrescribir para renderizado adicional
  }

  onSocialNetworksLoaded(data) {
    // Template hijo puede sobrescribir para renderizado adicional
  }

  onCurrentSongLoaded(songData) {
    // Template hijo puede sobrescribir para renderizado adicional
  }

  // Cargar contenido adicional (noticias, programas, etc.)
  async loadContent() {
    // Template hijo puede sobrescribir para cargar contenido específico
  }

  // Destruir la instancia
  destroy() {
    this.stopSonicPanelUpdates();
    this.audioPlayer.destroy();
  }
}

export default TemplateBase;
