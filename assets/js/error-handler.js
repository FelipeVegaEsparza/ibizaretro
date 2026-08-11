/**
 * Error Handler Global
 * Manejo centralizado de errores en la aplicación
 */

class ErrorHandler {
  constructor() {
    this.initialized = false;
    this.errorCallbacks = [];
    this.lastErrors = [];
    this.maxErrors = 10;
  }

  init() {
    if (this.initialized) return;
    
    // Capturar errores no manejados
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'uncaught'
      });
      
      // No prevenir el comportamiento por defecto en desarrollo
      if (window.location.hostname === 'localhost') {
        return false;
      }
      
      event.preventDefault();
    });
    
    // Capturar rechazos de promesas no manejados
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { type: 'unhandledrejection' }
      );
      
      if (window.location.hostname === 'localhost') {
        return false;
      }
      
      event.preventDefault();
    });
    
    // Capturar errores de recursos (imágenes, scripts, css)
    window.addEventListener('error', (event) => {
      if (event.target instanceof HTMLElement) {
        const tag = event.target.tagName.toLowerCase();
        const src = event.target.src || event.target.href || 'unknown';
        
        this.handleError(new Error(`Failed to load ${tag}: ${src}`), {
          type: 'resource',
          tag,
          src
        });
      }
    }, true); // Captura en fase de propagación
    
    this.initialized = true;
  }

  handleError(error, context = {}) {
    // Guardar error para debugging
    this.lastErrors.unshift({
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
    
    // Mantener solo los últimos N errores
    if (this.lastErrors.length > this.maxErrors) {
      this.lastErrors = this.lastErrors.slice(0, this.maxErrors);
    }
    
    // Log en desarrollo
    if (window.location.hostname === 'localhost') {
      console.error('[ErrorHandler]', error, context);
    }
    
    // Notificar callbacks registrados
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error, context);
      } catch (e) {
        console.error('Error in error callback:', e);
      }
    });
    
    // Mostrar UI de error si es crítico o es un error de API 503
    if (context.type === 'uncaught' || context.type === 'unhandledrejection' || 
        (error.message && error.message.includes('503'))) {
      this.showErrorUI(error);
    }
  }

  showErrorUI(error) {
    // Evitar mostrar múltiples notificaciones
    if (document.getElementById('global-error-toast')) return;
    
    const toast = document.createElement('div');
    toast.id = 'global-error-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #e74c3c;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 90vw;
      word-wrap: break-word;
      animation: slideUp 0.3s ease;
    `;
    
    // Mensaje amigable para el usuario
    const userMessage = this.getUserFriendlyMessage(error);
    toast.textContent = userMessage;
    
    document.body.appendChild(toast);
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideDown 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  getUserFriendlyMessage(error) {
    const message = error.message || 'Error desconocido';
    
    if (message.includes('fetch') || message.includes('network')) {
      return 'Error de conexión. Verifica tu internet.';
    }
    if (message.includes('timeout')) {
      return 'La conexión es muy lenta. Intenta de nuevo.';
    }
    if (message.includes('404')) {
      return 'Recurso no encontrado.';
    }
    if (message.includes('503')) {
      return 'Servidor de contenido no disponible. Algunas funciones pueden estar limitadas.';
    }
    if (message.includes('500') || message.includes('502')) {
      return 'Error del servidor. Intenta más tarde.';
    }
    
    return 'Ha ocurrido un error. Intenta recargar la página.';
  }

  showServerStatusBanner(isOnline) {
    const existingBanner = document.getElementById('server-status-banner');
    
    if (isOnline) {
      if (existingBanner) {
        existingBanner.style.animation = 'slideDown 0.3s ease forwards';
        setTimeout(() => existingBanner.remove(), 300);
      }
      return;
    }
    
    if (existingBanner) return;
    
    const banner = document.createElement('div');
    banner.id = 'server-status-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #f39c12;
      color: white;
      padding: 8px 16px;
      text-align: center;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      z-index: 99999;
      animation: slideDown 0.3s ease;
    `;
    banner.innerHTML = `
      ⚠️ Servidor de contenido no disponible. Algunas funciones están limitadas.
      <button onclick="this.parentElement.remove()" style="
        background: none;
        border: 1px solid white;
        color: white;
        padding: 2px 8px;
        margin-left: 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      ">Cerrar</button>
    `;
    
    document.body.prepend(banner);
  }

  onError(callback) {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
    };
  }

  getLastErrors() {
    return [...this.lastErrors];
  }

  clearErrors() {
    this.lastErrors = [];
  }
}

// Crear instancia global
const errorHandler = new ErrorHandler();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => errorHandler.init());
} else {
  errorHandler.init();
}

// Exportar
export default errorHandler;
export { ErrorHandler };

// Exponer globalmente para debugging
window.errorHandler = errorHandler;
