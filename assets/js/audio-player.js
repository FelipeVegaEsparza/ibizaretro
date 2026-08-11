/**
 * AudioPlayer - Maneja toda la lógica del reproductor de audio
 * Centralizado para todos los templates
 */
class AudioPlayer {
  constructor(options = {}) {
    this.audioElement = null;
    this.isPlaying = false;
    this.currentVolume = options.defaultVolume || 50;
    this.streamUrl = null;
    this.onPlayCallback = options.onPlay || (() => {});
    this.onPauseCallback = options.onPause || (() => {});
    this.onErrorCallback = options.onError || (() => {});
    this.onVolumeChangeCallback = options.onVolumeChange || (() => {});
    
    this.audioElementId = options.audioElementId || 'radio-audio';
    this.playButtonId = options.playButtonId || 'play-btn';
    this.volumeSliderId = options.volumeSliderId || 'volume-slider';
  }

  // Inicializar el reproductor
  init() {
    this.audioElement = document.getElementById(this.audioElementId);
    this.setupEventListeners();
    return this;
  }

  // Configurar event listeners
  setupEventListeners() {
    // Play button
    const playBtn = document.getElementById(this.playButtonId);
    if (playBtn) {
      playBtn.addEventListener('click', () => this.toggle());
    }

    // Volume slider
    const volumeSlider = document.getElementById(this.volumeSliderId);
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        this.setVolume(e.target.value);
      });
      // Set initial volume
      volumeSlider.value = this.currentVolume;
    }

    // Audio element events
    if (this.audioElement) {
      this.audioElement.addEventListener('loadstart', () => {
        console.log('AudioPlayer: Loading started');
      });

      this.audioElement.addEventListener('canplay', () => {
        console.log('AudioPlayer: Can play');
      });

      this.audioElement.addEventListener('error', (e) => {
        console.error('AudioPlayer: Audio error:', e);
        this.handleError(e);
      });

      this.audioElement.addEventListener('play', () => {
        this.isPlaying = true;
        this.onPlayCallback();
      });

      this.audioElement.addEventListener('pause', () => {
        this.isPlaying = false;
        this.onPauseCallback();
      });
    }
  }

  // Establecer URL del stream
  setStreamUrl(url) {
    this.streamUrl = url;
    console.log('AudioPlayer: Stream URL set to:', url);
  }

  // Reproducir
  play() {
    if (!this.audioElement || !this.streamUrl) {
      console.error('AudioPlayer: Cannot play - missing audio element or stream URL');
      return Promise.reject(new Error('Missing audio element or stream URL'));
    }

    this.audioElement.src = this.streamUrl;
    this.audioElement.volume = this.currentVolume / 100;

    return this.audioElement.play()
      .then(() => {
        console.log('AudioPlayer: Playing successfully');
        this.isPlaying = true;
        this.onPlayCallback();
      })
      .catch(error => {
        console.error('AudioPlayer: Error playing:', error);
        this.handleError(error);
        throw error;
      });
  }

  // Pausar
  pause() {
    if (!this.audioElement) return;
    
    this.audioElement.pause();
    this.isPlaying = false;
    this.onPauseCallback();
  }

  // Toggle play/pause
  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  // Ajustar volumen
  setVolume(value) {
    this.currentVolume = value;
    if (this.audioElement) {
      this.audioElement.volume = value / 100;
    }
    this.onVolumeChangeCallback(value);
  }

  // Obtener volumen actual
  getVolume() {
    return this.currentVolume;
  }

  // Verificar si está reproduciendo
  isPlayingNow() {
    return this.isPlaying;
  }

  // Manejar errores
  handleError(error) {
    this.isPlaying = false;
    this.onErrorCallback(error);
  }

  // Destruir el reproductor
  destroy() {
    this.pause();
    if (this.audioElement) {
      this.audioElement.src = '';
    }
  }
}

export default AudioPlayer;
