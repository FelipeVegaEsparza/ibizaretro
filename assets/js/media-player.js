// Integrated Media Player (Radio + TV)
import { getBasicData, getVideoStreamingUrl } from './api.js';
import VideoPlayer from './video-player.js';

class MediaPlayer {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.currentMode = 'radio'; // 'radio' or 'tv'
    this.radioPlayer = null;
    this.videoPlayer = null;
    this.videoStreamUrl = null;
    this.radioStreamUrl = null;
    
    this.options = {
      showToggle: true,
      defaultMode: 'radio',
      autoplay: false,
      ...options
    };
    
    this.init();
  }

  async init() {
    try {
      // Load basic data to get streaming URLs
      await this.loadStreamingData();
      
      // Create the integrated player interface
      this.createPlayerInterface();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize default mode
      this.switchMode(this.options.defaultMode);
      
      console.log('MediaPlayer: Initialized successfully');
    } catch (error) {
      console.error('MediaPlayer: Error initializing:', error);
    }
  }

  async loadStreamingData() {
    try {
      const basicData = await getBasicData();
      this.radioStreamUrl = basicData.radioStreamingUrl;
      this.videoStreamUrl = await getVideoStreamingUrl();
      
      console.log('MediaPlayer: Streaming URLs loaded', {
        radio: !!this.radioStreamUrl,
        video: !!this.videoStreamUrl
      });
    } catch (error) {
      console.error('MediaPlayer: Error loading streaming data:', error);
    }
  }

  createPlayerInterface() {
    if (!this.container) {
      throw new Error(`Container with ID "${this.containerId}" not found`);
    }

    const hasVideo = !!this.videoStreamUrl;
    const showToggle = this.options.showToggle && hasVideo;

    const playerHTML = `
      <div class="media-player-wrapper">
        ${showToggle ? `
          <div class="section-toggle">
            <button class="toggle-btn ${this.currentMode === 'radio' ? 'active' : ''}" data-mode="radio">
              <i class="fas fa-radio"></i>
              <span>Radio</span>
            </button>
            <button class="toggle-btn ${this.currentMode === 'tv' ? 'active' : ''}" data-mode="tv">
              <i class="fas fa-tv"></i>
              <span>TV Online</span>
            </button>
          </div>
        ` : ''}
        
        <!-- Radio Player Section -->
        <div class="player-content radio-content ${this.currentMode === 'radio' ? 'active' : ''}">
          <div class="player-section">
            <div id="${this.containerId}-radio-player">
              <!-- Radio player will be injected here -->
            </div>
          </div>
        </div>
        
        <!-- TV Player Section -->
        <div class="player-content tv-content ${this.currentMode === 'tv' ? 'active' : ''}">
          <div class="player-section">
            ${hasVideo ? `
              <div class="tv-mode">
                <div class="tv-header">
                  <i class="fas fa-tv"></i>
                  <h3>Transmisión en Vivo</h3>
                </div>
                <div id="${this.containerId}-video-player">
                  <!-- Video player will be injected here -->
                </div>
                <div class="tv-status">
                  <div class="status-dot"></div>
                  <span>Señal en vivo disponible</span>
                </div>
              </div>
            ` : `
              <div class="tv-mode">
                <div class="tv-unavailable">
                  <i class="fas fa-tv"></i>
                  <h3>TV Online no disponible</h3>
                  <p>Esta radio no tiene señal de televisión configurada</p>
                </div>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = playerHTML;
  }

  setupEventListeners() {
    // Toggle buttons
    const toggleButtons = this.container.querySelectorAll('.toggle-btn');
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.switchMode(mode);
      });
    });
  }

  switchMode(mode) {
    if (mode === this.currentMode) return;

    console.log(`MediaPlayer: Switching to ${mode} mode`);
    
    // Update current mode
    this.currentMode = mode;
    
    // Update toggle buttons
    const toggleButtons = this.container.querySelectorAll('.toggle-btn');
    toggleButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Update content visibility
    const contents = this.container.querySelectorAll('.player-content');
    contents.forEach(content => {
      content.classList.toggle('active', content.classList.contains(`${mode}-content`));
    });
    
    // Initialize the appropriate player
    if (mode === 'radio') {
      this.initializeRadioPlayer();
      this.pauseVideoPlayer();
    } else if (mode === 'tv') {
      this.initializeVideoPlayer();
      this.pauseRadioPlayer();
    }
  }

  initializeRadioPlayer() {
    if (this.radioPlayer) return;

    const radioContainer = document.getElementById(`${this.containerId}-radio-player`);
    if (!radioContainer) return;

    // Create a simple radio player interface
    radioContainer.innerHTML = `
      <div class="radio-player-simple">
        <div class="radio-info">
          <div class="radio-artwork">
            <div class="artwork-placeholder">
              <i class="fas fa-music"></i>
            </div>
          </div>
          <div class="radio-details">
            <h4 id="${this.containerId}-radio-title">Cargando...</h4>
            <p id="${this.containerId}-radio-artist">Conectando...</p>
          </div>
        </div>
        <div class="radio-controls">
          <button class="radio-play-btn" id="${this.containerId}-radio-play">
            <i class="fas fa-play"></i>
          </button>
        </div>
        <audio id="${this.containerId}-radio-audio" preload="none"></audio>
      </div>
    `;

    // Setup radio player functionality
    this.setupRadioPlayer();
  }

  setupRadioPlayer() {
    const audioElement = document.getElementById(`${this.containerId}-radio-audio`);
    const playButton = document.getElementById(`${this.containerId}-radio-play`);
    
    if (!audioElement || !playButton) return;

    let isPlaying = false;

    playButton.addEventListener('click', () => {
      if (isPlaying) {
        audioElement.pause();
        playButton.innerHTML = '<i class="fas fa-play"></i>';
        isPlaying = false;
      } else {
        if (this.radioStreamUrl) {
          audioElement.src = this.radioStreamUrl;
          audioElement.play().then(() => {
            playButton.innerHTML = '<i class="fas fa-pause"></i>';
            isPlaying = true;
          }).catch(error => {
            console.error('MediaPlayer: Error playing radio:', error);
          });
        }
      }
    });

    audioElement.addEventListener('pause', () => {
      playButton.innerHTML = '<i class="fas fa-play"></i>';
      isPlaying = false;
    });

    audioElement.addEventListener('play', () => {
      playButton.innerHTML = '<i class="fas fa-pause"></i>';
      isPlaying = true;
    });

    this.radioPlayer = { audioElement, playButton, isPlaying: () => isPlaying };
  }

  initializeVideoPlayer() {
    if (this.videoPlayer || !this.videoStreamUrl) return;

    const videoContainer = document.getElementById(`${this.containerId}-video-player`);
    if (!videoContainer) return;

    // Create video player instance
    this.videoPlayer = new VideoPlayer(`${this.containerId}-video-player`, {
      autoplay: this.options.autoplay,
      controls: true,
      muted: false
    });

    // Load the video stream
    setTimeout(() => {
      if (this.videoPlayer && this.videoStreamUrl) {
        this.videoPlayer.loadStream(this.videoStreamUrl);
      }
    }, 500);
  }

  pauseRadioPlayer() {
    if (this.radioPlayer && this.radioPlayer.audioElement) {
      this.radioPlayer.audioElement.pause();
    }
  }

  pauseVideoPlayer() {
    if (this.videoPlayer) {
      this.videoPlayer.pause();
    }
  }

  // Public methods
  switchToRadio() {
    this.switchMode('radio');
  }

  switchToTV() {
    this.switchMode('tv');
  }

  getCurrentMode() {
    return this.currentMode;
  }

  hasVideoStream() {
    return !!this.videoStreamUrl;
  }

  destroy() {
    if (this.radioPlayer && this.radioPlayer.audioElement) {
      this.radioPlayer.audioElement.pause();
      this.radioPlayer.audioElement.src = '';
    }

    if (this.videoPlayer) {
      this.videoPlayer.destroy();
    }

    this.radioPlayer = null;
    this.videoPlayer = null;
  }
}

// Export for use in templates
window.MediaPlayer = MediaPlayer;
export default MediaPlayer;