// Video Player Component for HLS Streaming
class VideoPlayer {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.videoElement = null;
    this.hls = null;
    this.isPlaying = false;
    this.isFullscreen = false;
    this.currentVolume = 0.8;
    this.streamUrl = null;
    
    // Options
    this.options = {
      autoplay: false,
      muted: false,
      controls: true,
      poster: null,
      ...options
    };
    
    this.init();
  }

  async init() {
    try {
      // Load HLS.js library if not already loaded
      await this.loadHLSLibrary();
      
      // Create video player HTML
      this.createVideoPlayer();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('VideoPlayer: Initialized successfully');
    } catch (error) {
      console.error('VideoPlayer: Error initializing:', error);
    }
  }

  async loadHLSLibrary() {
    return new Promise((resolve, reject) => {
      // Check if HLS.js is already loaded
      if (window.Hls) {
        resolve();
        return;
      }

      // Load HLS.js from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      script.onload = () => {
        console.log('VideoPlayer: HLS.js loaded successfully');
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load HLS.js library'));
      };
      document.head.appendChild(script);
    });
  }

  createVideoPlayer() {
    if (!this.container) {
      throw new Error(`Container with ID "${this.containerId}" not found`);
    }

    const playerHTML = `
      <div class="video-player-wrapper">
        <video 
          id="${this.containerId}-video"
          class="video-player"
          ${this.options.controls ? 'controls' : ''}
          ${this.options.muted ? 'muted' : ''}
          ${this.options.poster ? `poster="${this.options.poster}"` : ''}
          preload="metadata"
        >
          Tu navegador no soporta el elemento video.
        </video>
        
        <div class="video-overlay" id="${this.containerId}-overlay">
          <div class="video-controls">
            <button class="video-btn play-pause-btn" id="${this.containerId}-play-btn">
              <i class="fas fa-play"></i>
            </button>
            
            <div class="video-progress">
              <div class="progress-bar">
                <div class="progress-fill"></div>
              </div>
            </div>
            
            <div class="video-volume">
              <button class="video-btn volume-btn" id="${this.containerId}-volume-btn">
                <i class="fas fa-volume-up"></i>
              </button>
              <div class="volume-slider">
                <input type="range" min="0" max="100" value="80" id="${this.containerId}-volume-slider">
              </div>
            </div>
            
            <button class="video-btn fullscreen-btn" id="${this.containerId}-fullscreen-btn">
              <i class="fas fa-expand"></i>
            </button>
          </div>
          
          <div class="video-loading" id="${this.containerId}-loading">
            <div class="loading-spinner"></div>
            <span>Cargando stream...</span>
          </div>
          
          <div class="video-error" id="${this.containerId}-error" style="display: none;">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Error al cargar el video</span>
            <button class="retry-btn" id="${this.containerId}-retry">Reintentar</button>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = playerHTML;
    this.videoElement = document.getElementById(`${this.containerId}-video`);
  }

  setupEventListeners() {
    // Play/Pause button
    const playBtn = document.getElementById(`${this.containerId}-play-btn`);
    playBtn?.addEventListener('click', () => this.togglePlay());

    // Volume control
    const volumeBtn = document.getElementById(`${this.containerId}-volume-btn`);
    const volumeSlider = document.getElementById(`${this.containerId}-volume-slider`);

    volumeBtn?.addEventListener('click', () => this.toggleMute());
    volumeSlider?.addEventListener('input', (e) => this.setVolume(e.target.value / 100));

    // Fullscreen
    const fullscreenBtn = document.getElementById(`${this.containerId}-fullscreen-btn`);
    fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());

    // Retry button
    const retryBtn = document.getElementById(`${this.containerId}-retry`);
    retryBtn?.addEventListener('click', () => this.loadStream(this.streamUrl));

    // Video events
    if (this.videoElement) {
      this.videoElement.addEventListener('loadstart', () => this.showLoading());
      this.videoElement.addEventListener('canplay', () => this.hideLoading());
      this.videoElement.addEventListener('error', () => this.showError());
      this.videoElement.addEventListener('play', () => this.onPlay());
      this.videoElement.addEventListener('pause', () => this.onPause());
    }

    // Auto-hide controls
    this._setupAutoHideControls();

    // Fullscreen state tracking
    document.addEventListener('fullscreenchange', () => this._updateFullscreenState());
    document.addEventListener('webkitfullscreenchange', () => this._updateFullscreenState());
  }

  _setupAutoHideControls() {
    const wrapper = this.container.querySelector('.video-player-wrapper');
    if (!wrapper) return;

    this._hideControlsTimer = null;
    this._controlsHidden = false;

    const showControls = () => {
      wrapper.classList.remove('controls-hidden');
      this._controlsHidden = false;
      clearTimeout(this._hideControlsTimer);
      if (this.videoElement && !this.videoElement.paused) {
        this._hideControlsTimer = setTimeout(() => this._hideControls(), 3000);
      }
    };

    const onMouseMove = () => showControls();

    const onMouseLeave = () => {
      clearTimeout(this._hideControlsTimer);
      if (this.videoElement && !this.videoElement.paused) {
        this._hideControls();
      }
    };

    wrapper.addEventListener('mousemove', onMouseMove);
    wrapper.addEventListener('mouseleave', onMouseLeave);
    wrapper.addEventListener('mouseenter', showControls);

    showControls();
  }

  _hideControls() {
    const wrapper = this.container.querySelector('.video-player-wrapper');
    if (!wrapper) return;
    wrapper.classList.add('controls-hidden');
    this._controlsHidden = true;
  }

  _showControls() {
    const wrapper = this.container.querySelector('.video-player-wrapper');
    if (!wrapper) return;
    wrapper.classList.remove('controls-hidden');
    this._controlsHidden = false;
  }

  _updateFullscreenState() {
    this.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const btn = document.getElementById(`${this.containerId}-fullscreen-btn`);
    if (btn) {
      btn.innerHTML = this.isFullscreen
        ? '<i class="fas fa-compress"></i>'
        : '<i class="fas fa-expand"></i>';
      btn.title = this.isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa';
    }
  }

  async loadStream(streamUrl) {
    if (!streamUrl) {
      console.warn('VideoPlayer: No stream URL provided');
      return;
    }

    this.streamUrl = streamUrl;
    this.showLoading();
    this.hideError();

    try {
      if (window.Hls && window.Hls.isSupported()) {
        // Use HLS.js for browsers that don't support HLS natively
        if (this.hls) {
          this.hls.destroy();
        }

        this.hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        this.hls.loadSource(streamUrl);
        this.hls.attachMedia(this.videoElement);

        this.hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          console.log('VideoPlayer: HLS manifest parsed successfully');
          this.hideLoading();
          
          if (this.options.autoplay) {
            this.play();
          }
        });

        this.hls.on(window.Hls.Events.ERROR, (event, data) => {
          console.error('VideoPlayer: HLS error:', data);
          if (data.fatal) {
            this.showError();
          }
        });

      } else if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        this.videoElement.src = streamUrl;
        this.hideLoading();
        
        if (this.options.autoplay) {
          this.play();
        }
      } else {
        throw new Error('HLS not supported in this browser');
      }

    } catch (error) {
      console.error('VideoPlayer: Error loading stream:', error);
      this.showError();
    }
  }

  play() {
    if (this.videoElement) {
      this.videoElement.play().catch(error => {
        console.error('VideoPlayer: Error playing video:', error);
        this.showError();
      });
    }
  }

  pause() {
    if (this.videoElement) {
      this.videoElement.pause();
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  setVolume(volume) {
    if (this.videoElement) {
      this.videoElement.volume = Math.max(0, Math.min(1, volume));
      this.currentVolume = this.videoElement.volume;
      this.updateVolumeIcon();
    }
  }

  toggleMute() {
    if (this.videoElement) {
      this.videoElement.muted = !this.videoElement.muted;
      this.updateVolumeIcon();
    }
  }

  toggleFullscreen() {
    if (!this.videoElement) return;
    const isCurrentlyFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);

    if (!isCurrentlyFullscreen) {
      if (this.videoElement.requestFullscreen) {
        this.videoElement.requestFullscreen();
      } else if (this.videoElement.webkitRequestFullscreen) {
        this.videoElement.webkitRequestFullscreen();
      } else if (this.videoElement.msRequestFullscreen) {
        this.videoElement.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  onPlay() {
    this.isPlaying = true;
    const playBtn = document.getElementById(`${this.containerId}-play-btn`);
    if (playBtn) {
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
    const wrapper = this.container.querySelector('.video-player-wrapper');
    if (wrapper && this._hideControlsTimer === null) {
      this._hideControlsTimer = setTimeout(() => this._hideControls(), 3000);
    }
  }

  onPause() {
    this.isPlaying = false;
    const playBtn = document.getElementById(`${this.containerId}-play-btn`);
    if (playBtn) {
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
    clearTimeout(this._hideControlsTimer);
    this._hideControlsTimer = null;
    this._showControls();
  }

  updateVolumeIcon() {
    const volumeBtn = document.getElementById(`${this.containerId}-volume-btn`);
    if (!volumeBtn || !this.videoElement) return;

    let icon = 'fas fa-volume-up';
    if (this.videoElement.muted || this.videoElement.volume === 0) {
      icon = 'fas fa-volume-mute';
    } else if (this.videoElement.volume < 0.5) {
      icon = 'fas fa-volume-down';
    }

    volumeBtn.innerHTML = `<i class="${icon}"></i>`;
  }

  showLoading() {
    const loading = document.getElementById(`${this.containerId}-loading`);
    if (loading) loading.style.display = 'flex';
  }

  hideLoading() {
    const loading = document.getElementById(`${this.containerId}-loading`);
    if (loading) loading.style.display = 'none';
  }

  showError() {
    const error = document.getElementById(`${this.containerId}-error`);
    if (error) error.style.display = 'flex';
    this.hideLoading();
  }

  hideError() {
    const error = document.getElementById(`${this.containerId}-error`);
    if (error) error.style.display = 'none';
  }

  destroy() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
    }
  }
}

// Export for use in templates
window.VideoPlayer = VideoPlayer;
export default VideoPlayer;