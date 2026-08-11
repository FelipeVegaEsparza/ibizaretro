# Integración de TV Online

Esta documentación explica cómo se ha integrado la funcionalidad de TV Online a los reproductores de radio PWA.

## 🎯 Características Implementadas

### ✅ **Video Player con HLS Support**
- Soporte completo para streams .m3u8 (HLS)
- Controles personalizados de video
- Modo pantalla completa
- Control de volumen
- Indicadores de carga y error
- Responsive design

### ✅ **Integración con API IPStream**
- Obtiene automáticamente la URL de video streaming desde `videoStreamingUrl`
- Detecta si el cliente tiene TV configurada
- Manejo graceful cuando no hay señal de TV disponible

### ✅ **Media Player Integrado**
- Combina radio y TV en una sola interfaz
- Toggle entre modos Radio y TV
- Pausa automática entre modos
- Interfaz unificada y consistente

## 📁 Archivos Creados

### **Core Components**
- `assets/js/video-player.js` - Componente principal del reproductor de video
- `assets/js/media-player.js` - Reproductor integrado (Radio + TV)
- `assets/css/video-player.css` - Estilos para el reproductor de video

### **API Extensions**
- Función `getVideoStreamingUrl()` agregada a `assets/js/api.js`

### **Template Integration**
- Template `playlist` actualizado con sección de TV Online
- Menú de navegación expandido
- Función `loadTVOnline()` agregada

## 🚀 Cómo Usar

### **1. Para Templates Existentes**

#### Agregar al HTML:
```html
<!-- En el <head> -->
<link rel="stylesheet" href="/assets/css/video-player.css">

<!-- En el menú de navegación -->
<li><a href="#" class="menu-item" data-section="tv-online">
  <i class="fas fa-tv"></i>
  <span>TV Online</span>
</a></li>

<!-- Sección de contenido -->
<div id="tv-online-view" class="content-view">
  <div class="view-header">
    <h1>TV Online</h1>
    <p>Disfruta de nuestra señal de televisión en vivo</p>
  </div>
  
  <div class="tv-online-container">
    <div id="tv-player-container">
      <!-- TV Player will be injected here -->
    </div>
  </div>
</div>

<!-- Antes del </body> -->
<script type="module" src="/assets/js/video-player.js"></script>
```

#### Agregar al JavaScript:
```javascript
// En la función loadSectionContent()
case 'tv-online':
  await this.loadTVOnline();
  break;

// Agregar función loadTVOnline()
async loadTVOnline() {
  console.log('Loading TV Online section');
  
  try {
    const { getVideoStreamingUrl } = await import('/assets/js/api.js');
    
    const container = document.getElementById('tv-player-container');
    if (!container) return;

    const videoStreamUrl = await getVideoStreamingUrl();
    
    if (!videoStreamUrl) {
      container.innerHTML = `
        <div class="tv-mode">
          <div class="tv-unavailable">
            <i class="fas fa-tv"></i>
            <h3>TV Online no disponible</h3>
            <p>Esta radio no tiene señal de televisión configurada</p>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
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
    `;

    setTimeout(() => {
      if (window.VideoPlayer) {
        this.tvPlayer = new window.VideoPlayer('tv-video-player', {
          autoplay: false,
          controls: true,
          muted: false
        });

        if (this.tvPlayer && videoStreamUrl) {
          this.tvPlayer.loadStream(videoStreamUrl);
        }
      }
    }, 500);

  } catch (error) {
    console.error('Error loading TV Online:', error);
  }
}
```

### **2. Uso del Video Player Standalone**

```javascript
// Crear instancia del reproductor
const videoPlayer = new VideoPlayer('video-container', {
  autoplay: false,
  controls: true,
  muted: false,
  poster: 'path/to/poster.jpg'
});

// Cargar stream
videoPlayer.loadStream('https://example.com/stream.m3u8');

// Controlar reproducción
videoPlayer.play();
videoPlayer.pause();
videoPlayer.setVolume(0.8);
```

### **3. Uso del Media Player Integrado**

```javascript
// Crear reproductor integrado (Radio + TV)
const mediaPlayer = new MediaPlayer('media-container', {
  showToggle: true,
  defaultMode: 'radio',
  autoplay: false
});

// Cambiar modos
mediaPlayer.switchToTV();
mediaPlayer.switchToRadio();

// Verificar disponibilidad
if (mediaPlayer.hasVideoStream()) {
  console.log('TV disponible');
}
```

## 🎨 Personalización de Estilos

### **Variables CSS Principales**
```css
:root {
  --video-primary-color: #ff6b6b;
  --video-bg-color: #000;
  --video-overlay-color: rgba(0, 0, 0, 0.8);
  --video-control-size: 40px;
  --video-border-radius: 12px;
}
```

### **Clases CSS Importantes**
- `.video-player-wrapper` - Contenedor principal
- `.video-controls` - Controles del reproductor
- `.tv-mode` - Contenedor del modo TV
- `.tv-unavailable` - Estado cuando no hay TV
- `.media-player-wrapper` - Reproductor integrado

## 🔧 Configuración API

### **Estructura de Respuesta Esperada**
```json
{
  "basicData": {
    "projectName": "Radio Test",
    "radioStreamingUrl": "https://stream.example.com/radio",
    "videoStreamingUrl": "https://stream.example.com/tv.m3u8"
  }
}
```

### **Detección Automática**
- Si `videoStreamingUrl` está vacío o es `null`, se muestra mensaje de "no disponible"
- Si la URL existe, se inicializa el reproductor automáticamente
- Soporte para URLs .m3u8 (HLS) y otros formatos compatibles

## 📱 Responsive Design

### **Breakpoints**
- **Desktop**: Controles completos, hover effects
- **Tablet** (≤768px): Controles adaptados, botones más grandes
- **Mobile** (≤480px): Layout vertical, controles simplificados

### **Características Mobile**
- Touch-friendly controls
- Fullscreen optimizado
- Volume slider siempre visible
- Gestos de tap para play/pause

## 🛠️ Troubleshooting

### **Problemas Comunes**

1. **Video no carga**
   - Verificar que la URL .m3u8 sea válida
   - Comprobar CORS headers del servidor de streaming
   - Revisar console para errores de HLS.js

2. **Controles no responden**
   - Verificar que HLS.js se haya cargado correctamente
   - Comprobar que el elemento video esté presente en el DOM

3. **Fullscreen no funciona**
   - Verificar permisos del navegador
   - Comprobar que el elemento tenga los event listeners correctos

### **Debug Mode**
```javascript
// Habilitar logs detallados
window.VideoPlayerDebug = true;
```

## 🔄 Flujo de Funcionamiento

1. **Inicialización**
   - Se carga HLS.js desde CDN
   - Se crea la interfaz del reproductor
   - Se configuran event listeners

2. **Carga de Stream**
   - Se obtiene URL desde API IPStream
   - Se verifica compatibilidad HLS
   - Se inicializa reproductor apropiado

3. **Reproducción**
   - HLS.js maneja el stream .m3u8
   - Controles personalizados manejan interacción
   - Estados se sincronizan automáticamente

## 📈 Próximas Mejoras

- [ ] Soporte para múltiples calidades de video
- [ ] Picture-in-Picture mode
- [ ] Chromecast integration
- [ ] Subtítulos/closed captions
- [ ] Analytics de visualización
- [ ] Modo audio-only para TV
- [ ] Programación de TV (EPG)

## 🤝 Contribuir

Para agregar esta funcionalidad a otros templates:

1. Copiar los archivos core (`video-player.js`, `video-player.css`)
2. Agregar la función `getVideoStreamingUrl()` a la API
3. Integrar la sección de TV al template
4. Probar con diferentes tipos de streams .m3u8

¡La funcionalidad está lista para usar y es completamente compatible con la infraestructura existente de IPStream!