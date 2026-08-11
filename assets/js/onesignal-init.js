/**
 * OneSignal Initialization
 * Inicializa OneSignal automáticamente al cargar la página
 * 
 * USO:
 * 1. Importar este archivo en tu HTML principal
 * 2. Agregar un contenedor con id="notification-button-container" donde quieras el botón
 * 
 * Ejemplo:
 * <script type="module" src="/assets/js/onesignal-init.js"></script>
 * <div id="notification-button-container"></div>
 */

import { oneSignalManager } from './onesignal-manager.js';
import { initNotificationButton } from './notification-button.js';

// Inicializar OneSignal cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  console.log('OneSignal: Iniciando...');
  
  // Inicializar OneSignal
  const initialized = await oneSignalManager.init();
  
  // Hacer disponible globalmente para el PWA installer
  window.oneSignalManager = oneSignalManager;
  
  if (initialized) {
    console.log('OneSignal: Inicializado correctamente');
    
    // Inicializar el botón de notificaciones si existe el contenedor
    const container = document.getElementById('notification-button-container');
    if (container) {
      initNotificationButton('notification-button-container');
    } else {
      console.log('OneSignal: Contenedor de botón no encontrado. Agrega <div id="notification-button-container"></div> en tu HTML');
    }
  } else {
    console.log('OneSignal: No se pudo inicializar (cliente sin configuración o navegador no soportado)');
  }
}

// Exportar para uso manual si es necesario
export { oneSignalManager, initNotificationButton };
