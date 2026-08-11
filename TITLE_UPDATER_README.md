# Sistema de Actualización Automática de Títulos

Este sistema actualiza automáticamente los títulos de todas las páginas usando la variable `project_name` del archivo `config/config.json`.

## Funcionamiento

### 🔄 **Proceso Automático**

1. **Carga del config**: El script lee el archivo `/config/config.json`
2. **Extracción del nombre**: Obtiene el valor de `project_name`
3. **Actualización del título**: Cambia `document.title` al nombre del proyecto
4. **Meta tags**: Actualiza meta tags relacionados con el título

### 📁 **Archivos Involucrados**

#### Script Principal
- `assets/js/title-updater.js` - Lógica de actualización de títulos

#### Archivos Modificados
- `index.html` - Página principal de redirección
- `templates/template2/index.html` - Radio Landing
- `templates/template3/index.html` - Radio Stream
- `templates/template4/index.html` - Radio News Hub
- `templates/template5/index.html` - Radio Nexus
- `templates/template6/index.html` - Radio Pulse
- `templates/template7/index.html` - Radio Pulse Player

### ⚙️ **Configuración**

El sistema lee la configuración desde `config/config.json`:

```json
{
  "project_name": "Radio Fusion Austral",
  // ... otras configuraciones
}
```

### 🎯 **Resultado**

Todos los títulos de las páginas mostrarán automáticamente:
- **Título de la pestaña**: "Radio Fusion Austral"
- **Meta tags actualizados**: application-name, apple-mobile-web-app-title, og:title, twitter:title

## Implementación Técnica

### Clase TitleUpdater

```javascript
class TitleUpdater {
  constructor() {
    this.projectName = null;
    this.init();
  }

  async init() {
    await this.loadProjectName();
    this.updateTitle();
  }

  async loadProjectName() {
    const response = await fetch('/config/config.json');
    const config = await response.json();
    this.projectName = config.project_name;
  }

  updateTitle() {
    document.title = this.projectName;
    this.updateMetaTags();
  }
}
```

### Inicialización Automática

El script se inicializa automáticamente cuando el DOM está listo:

```javascript
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.titleUpdater = new TitleUpdater();
  });
} else {
  window.titleUpdater = new TitleUpdater();
}
```

## Meta Tags Actualizados

El sistema actualiza automáticamente estos meta tags si existen:

### 📱 **PWA Meta Tags**
- `meta[name="application-name"]`
- `meta[name="apple-mobile-web-app-title"]`

### 🌐 **SEO Meta Tags**
- `meta[property="og:title"]` (Open Graph)
- `meta[name="twitter:title"]` (Twitter Cards)

## Logs de Debug

El sistema incluye logs detallados para debugging:

```javascript
console.log('TitleUpdater: Project name loaded:', this.projectName);
console.log('TitleUpdater: Title updated to:', this.projectName);
console.log('TitleUpdater: Meta tags updated');
```

## Manejo de Errores

### Errores Comunes

1. **Config no encontrado**: Si `/config/config.json` no existe
2. **project_name faltante**: Si la variable no está en el config
3. **Fetch fallido**: Si hay problemas de red

### Comportamiento de Fallback

- Si hay error, mantiene el título original
- Logs de error en la consola para debugging
- No interrumpe la carga de la página

## Personalización

### Cambiar el Nombre del Proyecto

Edita `config/config.json`:

```json
{
  "project_name": "Tu Nuevo Nombre de Radio"
}
```

El cambio se aplicará automáticamente en la próxima carga de página.

### Agregar Más Meta Tags

Modifica el método `updateMetaTags()` en `title-updater.js`:

```javascript
updateMetaTags() {
  // Agregar nuevo meta tag
  const customMeta = document.querySelector('meta[name="custom-title"]');
  if (customMeta) {
    customMeta.setAttribute('content', this.projectName);
  }
}
```

## Compatibilidad

### Navegadores Soportados
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Opera 47+

### Tecnologías Utilizadas
- **Fetch API**: Para cargar el config.json
- **Async/Await**: Para manejo asíncrono
- **DOM Manipulation**: Para actualizar títulos y meta tags
- **Event Listeners**: Para inicialización automática

## Orden de Carga

El script se carga antes que otros scripts para asegurar que el título se actualice lo antes posible:

```html
<script src="/assets/js/title-updater.js"></script>
<script src="/assets/js/pwa-installer.js"></script>
<script type="module" src="assets/js/main.js"></script>
```

## Beneficios

### 🎯 **Centralización**
- Un solo lugar para cambiar el nombre: `config.json`
- Actualización automática en todos los templates

### 🚀 **Automatización**
- No necesidad de editar manualmente cada HTML
- Sincronización automática con la configuración

### 📱 **PWA Compliant**
- Actualiza meta tags necesarios para PWA
- Consistencia en todos los puntos de entrada

### 🔧 **Mantenimiento**
- Fácil de mantener y actualizar
- Logs detallados para debugging