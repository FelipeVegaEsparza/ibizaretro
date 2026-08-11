/**
 * Template Minimalista - Refactorizado usando TemplateBase
 * Este template solo se encarga del renderizado visual minimalista
 * Toda la lógica de datos y audio está en TemplateBase
 */
import TemplateBase from '/assets/js/template-base.js';
import { getDataManager } from '/assets/js/data-manager.js';
import VuMeter from '/assets/js/vu-meter.js';

class MinimalistaTemplate extends TemplateBase {
  constructor() {
    super({
      audioElementId: 'radio-audio',
      playButtonId: 'play-btn',
      volumeSliderId: 'volume-slider',
      defaultVolume: 50,
      socialContainerIds: ['social-links']
    });

    this.videoStreamUrl = null;
    this.vuMeter = null;
  }

  async init() {
    await super.init();

    try {
      // Inicializa el VU meter en modo idle (visible desde el primer
      // render, sin esperar a que el usuario haga play)
      this.vuMeter = new VuMeter();
      this.vuMeter.init();
      this.vuMeter.stop();

      await this.checkTVAvailability();
      console.log('MinimalistaTemplate: Template fully initialized! 🚀');
    } catch (error) {
      console.error('MinimalistaTemplate: Error in template-specific init:', error);
    }
  }

  async checkTVAvailability() {
    try {
      const dataManager = getDataManager();
      this.videoStreamUrl = await dataManager.loadVideoStreamUrl();

      const tvBtn = document.getElementById('tv-online-btn');
      if (tvBtn) {
        tvBtn.style.display = this.videoStreamUrl ? 'flex' : 'none';
        tvBtn.addEventListener('click', () => this.openTVPopup());
      }

      const closeBtn = document.getElementById('tv-popup-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeTVPopup());
      }

      const overlay = document.getElementById('tv-popup-overlay');
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) this.closeTVPopup();
        });
      }
    } catch (error) {
      console.error('MinimalistaTemplate: Error checking TV availability:', error);
    }
  }

  openTVPopup() {
    const overlay = document.getElementById('tv-popup-overlay');
    if (overlay) {
      overlay.classList.add('active');
      if (!this._tvPlayer) this._initTVPlayer();
    }
  }

  closeTVPopup() {
    const overlay = document.getElementById('tv-popup-overlay');
    if (overlay) overlay.classList.remove('active');
    if (this._tvPlayer && this._tvPlayer.videoElement) {
      this._tvPlayer.videoElement.pause();
      this._tvPlayer.videoElement.currentTime = 0;
    }
  }

  _initTVPlayer() {
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

  // Sobrescribir: Actualizar display de canción actual con estilo minimalista
  updateCurrentSongDisplay(songData) {
    // Llamar al método base primero
    super.updateCurrentSongDisplay(songData);
    
    // Actualizar fondo con artwork si existe
    const bgCover = document.getElementById('bg-cover');
    if (bgCover) {
      if (songData.art) {
        bgCover.style.backgroundImage = `url(${songData.art})`;
      } else if (this._radioCoverUrl) {
        bgCover.style.backgroundImage = `url(${this._radioCoverUrl})`;
      } else {
        bgCover.style.backgroundImage = '';
      }
    }
  }

  // Sobrescribir: Cuando se reproduce audio
  onAudioPlay() {
    super.onAudioPlay();

    // Arranca el VU meter (análisis real del audio)
    if (this.vuMeter) this.vuMeter.start();

    // Animación del disco
    const artworkInner = document.querySelector('.artwork-inner');
    if (artworkInner) {
      artworkInner.classList.add('playing');
    }
  }

  // Sobrescribir: Cuando se pausa audio
  onAudioPause() {
    super.onAudioPause();

    // Detiene el VU meter
    if (this.vuMeter) this.vuMeter.stop();

    // Detiene la animación del disco
    const artworkInner = document.querySelector('.artwork-inner');
    if (artworkInner) {
      artworkInner.classList.remove('playing');
    }
  }

  // Cleanup
  destroy() {
    if (this.vuMeter) {
      this.vuMeter.destroy();
      this.vuMeter = null;
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.minimalistaTemplate = new MinimalistaTemplate();
    await window.minimalistaTemplate.init();
  } catch (error) {
    console.error('MinimalistaTemplate: Error creating instance:', error);
  }
});

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
  if (window.minimalistaTemplate) {
    window.minimalistaTemplate.destroy();
  }
});

export default MinimalistaTemplate;
