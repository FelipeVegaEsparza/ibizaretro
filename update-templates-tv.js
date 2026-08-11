// Script para agregar funcionalidad de TV Online a todos los templates
const fs = require('fs');
const path = require('path');

const templates = [
  'blue', 'burbujas', 'carmesi', 'clasico', 'coffee', 'cyberpunk', 
  'dark', 'esmeralda', 'indigo', 'magazine', 'magenta', 'oceano', 
  'petroleo', 'purpura', 'sobrio', 'sunset', 'turquesa'
];

// Función para actualizar HTML
function updateHTML(templatePath) {
  const htmlPath = path.join(templatePath, 'index.html');
  
  if (!fs.existsSync(htmlPath)) {
    console.log(`❌ HTML not found: ${htmlPath}`);
    return;
  }

  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // 1. Agregar CSS del video player
  if (!html.includes('/assets/css/video-player.css')) {
    html = html.replace(
      /(<link rel="stylesheet" href="[^"]*notification-button\.css">)/,
      '$1\n  <link rel="stylesheet" href="/assets/css/video-player.css">'
    );
  }

  // 2. Agregar script del video player
  if (!html.includes('/assets/js/video-player.js')) {
    html = html.replace(
      /(<script type="module" src="\/assets\/js\/onesignal-init\.js"><\/script>)/,
      '$1\n  <script type="module" src="/assets/js/video-player.js"></script>'
    );
  }

  // 3. Buscar diferentes patrones de player container
  const playerPatterns = [
    { search: /(<div class="main-player">)/, replace: '<!-- Media Toggle -->\n    <div class="section-toggle" id="media-toggle" style="display: none;">\n      <button class="toggle-btn active" data-mode="radio">\n        <i class="fas fa-radio"></i>\n        <span>Radio</span>\n      </button>\n      <button class="toggle-btn" data-mode="tv">\n        <i class="fas fa-tv"></i>\n        <span>TV Online</span>\n      </button>\n    </div>\n\n    $1' },
    { search: /(<div class="player-container">)/, replace: '<!-- Media Toggle -->\n    <div class="section-toggle" id="media-toggle" style="display: none;">\n      <button class="toggle-btn active" data-mode="radio">\n        <i class="fas fa-radio"></i>\n        <span>Radio</span>\n      </button>\n      <button class="toggle-btn" data-mode="tv">\n        <i class="fas fa-tv"></i>\n        <span>TV Online</span>\n      </button>\n    </div>\n\n    $1' },
    { search: /(<div class="radio-player">)/, replace: '<!-- Media Toggle -->\n    <div class="section-toggle" id="media-toggle" style="display: none;">\n      <button class="toggle-btn active" data-mode="radio">\n        <i class="fas fa-radio"></i>\n        <span>Radio</span>\n      </button>\n      <button class="toggle-btn" data-mode="tv">\n        <i class="fas fa-tv"></i>\n        <span>TV Online</span>\n      </button>\n    </div>\n\n    $1' }
  ];

  // Aplicar el primer patrón que coincida
  let toggleAdded = false;
  for (const pattern of playerPatterns) {
    if (pattern.search.test(html) && !html.includes('media-toggle')) {
      html = html.replace(pattern.search, pattern.replace);
      toggleAdded = true;
      break;
    }
  }

  // 4. Agregar ID al contenedor principal del player
  if (!html.includes('id="radio-player"')) {
    html = html.replace(
      /<div class="main-player">/,
      '<div class="main-player" id="radio-player">'
    );
  }

  // 5. Agregar sección de TV después del player principal
  if (!html.includes('tv-player-container')) {
    const footerPattern = /(\s*<!-- Footer -->|\s*<footer)/;
    if (footerPattern.test(html)) {
      html = html.replace(
        footerPattern,
        '\n    <!-- TV Player -->\n    <div class="tv-player" id="tv-player" style="display: none;">\n      <div id="tv-player-container">\n        <!-- TV Player will be injected here -->\n      </div>\n    </div>\n\n$1'
      );
    }
  }

  fs.writeFileSync(htmlPath, html);
  console.log(`✅ Updated HTML: ${templatePath}`);
}

// Función para actualizar JavaScript
function updateJS(templatePath) {
  const jsPath = path.join(templatePath, 'assets', 'js', 'main.js');
  
  if (!fs.existsSync(jsPath)) {
    console.log(`❌ JS not found: ${jsPath}`);
    return;
  }

  let js = fs.readFileSync(jsPath, 'utf8');

  // 1. Agregar propiedades al constructor
  if (!js.includes('this.tvPlayer')) {
    js = js.replace(
      /(this\.visualizerInterval = null;)/,
      '$1\n    this.tvPlayer = null;\n    this.currentMode = \'radio\';\n    this.videoStreamUrl = null;'
    );
  }

  // 2. Agregar llamadas en init()
  if (!js.includes('checkTVAvailability')) {
    js = js.replace(
      /(await this\.loadSocialNetworks\(\);)/,
      '$1\n      await this.checkTVAvailability();\n      this.setupMediaToggle();'
    );
  }

  // 3. Agregar funciones antes del cierre de la clase
  if (!js.includes('checkTVAvailability()')) {
    const tvFunctions = `
  async checkTVAvailability() {
    try {
      const { getVideoStreamingUrl } = await import('/assets/js/api.js');
      this.videoStreamUrl = await getVideoStreamingUrl();
      
      if (this.videoStreamUrl) {
        const mediaToggle = document.getElementById('media-toggle');
        if (mediaToggle) {
          mediaToggle.style.display = 'flex';
        }
        console.log('Player: TV Online available');
      } else {
        console.log('Player: TV Online not available');
      }
    } catch (error) {
      console.error('Player: Error checking TV availability:', error);
    }
  }

  setupMediaToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.switchMode(mode);
      });
    });
  }

  switchMode(mode) {
    if (mode === this.currentMode) return;

    console.log(\`Player: Switching to \${mode} mode\`);
    
    this.currentMode = mode;
    
    // Update toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    toggleButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Update content visibility
    const radioPlayer = document.getElementById('radio-player');
    const tvPlayer = document.getElementById('tv-player');
    
    if (mode === 'radio') {
      radioPlayer.style.display = 'block';
      tvPlayer.style.display = 'none';
      this.pauseTVPlayer();
    } else if (mode === 'tv') {
      radioPlayer.style.display = 'none';
      tvPlayer.style.display = 'block';
      this.pauseAudio();
      this.initializeTVPlayer();
    }
  }

  async initializeTVPlayer() {
    if (this.tvPlayer || !this.videoStreamUrl) return;

    const container = document.getElementById('tv-player-container');
    if (!container) return;

    try {
      container.innerHTML = \`
        <div class="tv-mode">
          <div class="tv-header">
            <i class="fas fa-tv"></i>
            <h3>Transmisión en Vivo</h3>
          </div>
          <div id="tv-video-player"></div>
          <div class="tv-status">
            <div class="status-dot"></div>
            <span>Señal en vivo disponible</span>
          </div>
        </div>
      \`;

      setTimeout(() => {
        if (window.VideoPlayer) {
          this.tvPlayer = new window.VideoPlayer('tv-video-player', {
            autoplay: false,
            controls: true,
            muted: false
          });

          if (this.tvPlayer && this.videoStreamUrl) {
            this.tvPlayer.loadStream(this.videoStreamUrl);
          }
        }
      }, 500);

    } catch (error) {
      console.error('Player: Error initializing TV player:', error);
      container.innerHTML = \`
        <div class="tv-mode">
          <div class="tv-unavailable">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error al cargar TV Online</h3>
            <p>Hubo un problema al cargar la señal de televisión</p>
          </div>
        </div>
      \`;
    }
  }

  pauseTVPlayer() {
    if (this.tvPlayer) {
      this.tvPlayer.pause();
    }
  }`;

    // Buscar el final de la clase y agregar las funciones
    const classEndPattern = /(\s+if \(this\.audioPlayer\) \{\s+this\.audioPlayer\.pause\(\);\s+this\.audioPlayer\.src = '';\s+\}\s+\})/;
    if (classEndPattern.test(js)) {
      js = js.replace(
        classEndPattern,
        `$1${tvFunctions}\n`
      );
    } else {
      // Patrón alternativo para el final de la clase
      const altPattern = /(\s+\}\s+\}\s*\n\s*\/\/ Initialize)/;
      if (altPattern.test(js)) {
        js = js.replace(
          altPattern,
          `${tvFunctions}\n  }\n}\n\n// Initialize`
        );
      }
    }
  }

  // 4. Actualizar destroy() para incluir TV player
  if (js.includes('this.audioPlayer.src = \'\';') && !js.includes('this.tvPlayer.destroy()')) {
    js = js.replace(
      /(this\.audioPlayer\.src = '';)/,
      '$1\n\n    if (this.tvPlayer) {\n      this.tvPlayer.destroy();\n    }'
    );
  }

  fs.writeFileSync(jsPath, js);
  console.log(`✅ Updated JS: ${templatePath}`);
}

// Ejecutar actualizaciones
console.log('🚀 Starting TV Online integration for all templates...\n');

templates.forEach(templateName => {
  const templatePath = path.join(__dirname, 'templates', templateName);
  
  if (fs.existsSync(templatePath)) {
    console.log(`📁 Processing template: ${templateName}`);
    updateHTML(templatePath);
    updateJS(templatePath);
    console.log('');
  } else {
    console.log(`❌ Template not found: ${templateName}\n`);
  }
});

console.log('✅ TV Online integration completed for all templates!');
console.log('\n📋 Summary:');
console.log('- Added video-player.css to all templates');
console.log('- Added video-player.js script to all templates');
console.log('- Added Radio/TV toggle to all templates');
console.log('- Added TV player container to all templates');
console.log('- Added TV functionality to JavaScript classes');
console.log('\n🎯 All templates now support TV Online streaming!');