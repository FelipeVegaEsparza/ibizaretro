# TV Online Implementation - Template Petroleo

## Implementación Completada

Se ha implementado exitosamente el reproductor de TV Online en el template Petroleo con las mismas características que el template Blue.

### Ubicación
- **Posición**: Entre el header (menú de navegación) y la sección hero de noticias
- **Visibilidad**: Solo se muestra cuando existe una URL de streaming de video en la API

### Características Técnicas

#### HTML Structure
- Nueva sección `tv-online-section` agregada después del `</header>`
- Contenedor `tv-player-wrapper` con efectos glassmorphism
- Indicador de "EN VIVO" con animación de pulso
- Diseño responsivo adaptado al estilo del template petroleo

#### CSS Styles - Tema Petroleo
- Estilos integrados en `templates/petroleo/assets/css/style.css`
- **Colores adaptados al tema petroleo**:
  - Fondo: Gradiente de grises oscuros (#2c3e50, #34495e, #4a5568, #2d3748, #1a202c)
  - Texto principal: #ffffff (blanco)
  - Texto secundario: #e2e8f0, #cbd5e0, #a0aec0
  - Acentos: #4a5568
- Efectos glassmorphism con transparencias blancas
- Animaciones de pulso para el indicador en vivo
- Diseño responsivo para móviles y tablets
- Altura adaptativa: 500px en desktop, 300px en tablet, 250px en móvil

#### JavaScript Functionality
- Métodos agregados a la clase `RadioPulse`:
  - `checkTVAvailability()`: Verifica si existe URL de streaming
  - `initializeTVPlayer()`: Inicializa el reproductor de video
  - `pauseTVPlayer()`: Pausa y limpia el reproductor
- Soporte para streams HLS (.m3u8) usando HLS.js
- Fallback para video nativo del navegador
- Manejo de errores y estados de carga
- ID único del video: `tv-video-petroleo`

### Flujo de Funcionamiento

1. **Inicialización**: Al cargar la página, se ejecuta `checkTVAvailability()`
2. **Verificación**: Se consulta la API para obtener `videoStreamingUrl`
3. **Mostrar/Ocultar**: Si existe URL, se muestra la sección TV, si no, permanece oculta
4. **Reproductor**: Se inicializa automáticamente el reproductor de video
5. **HLS Support**: Para streams .m3u8, se carga HLS.js dinámicamente
6. **Fallback**: Para otros formatos, usa el reproductor nativo del navegador

### Estados del Reproductor

#### Con URL de Video
- Muestra el reproductor de video funcional
- Indicador "EN VIVO" con animación
- Controles nativos del navegador
- Autoplay (si el navegador lo permite)

#### Sin URL de Video
- Sección completamente oculta (`display: none`)
- No consume recursos ni espacio en la página

#### Error de Configuración
- Mensaje informativo sobre configuración faltante
- Instrucciones para habilitar TV Online en IPStream

### Archivos Modificados

1. **templates/petroleo/index.html**
   - Agregada sección TV entre header y main
   - Estructura HTML del reproductor
   - Corregidas rutas de CSS y JavaScript

2. **templates/petroleo/assets/css/style.css**
   - Estilos específicos para la sección TV
   - Diseño responsivo y efectos glassmorphism
   - Colores adaptados al tema petroleo (grises oscuros)

3. **templates/petroleo/assets/js/main.js**
   - Importación de `getVideoStreamingUrl`
   - Propiedades del reproductor en constructor
   - Métodos para manejo del reproductor TV
   - Integración con el ciclo de vida de la aplicación
   - Corrección de errores de sintaxis en método destroy

### Diferencias con Template Blue
- **Esquema de colores**: Adaptado a los tonos grises oscuros del tema petroleo
- **ID del video**: `tv-video-petroleo` (único para evitar conflictos)
- **Colores de texto**: Blancos y grises claros para contraste en fondo oscuro

### Compatibilidad
- ✅ Streams HLS (.m3u8) con HLS.js
- ✅ Video MP4 nativo
- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ Dispositivos móviles y tablets
- ✅ Diseño responsivo

### Próximos Pasos
- La implementación está lista para uso en producción
- Se puede probar cambiando la configuración a `"template": "petroleo"`
- Compatible con el sistema de configuración existente de IPStream