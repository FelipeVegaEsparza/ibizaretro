/**
 * PWA Installer - Sistema global de instalación de aplicaciones web progresivas
 * Maneja la instalación en diferentes dispositivos y navegadores
 */

class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.isIOS = false;
    this.isStandalone = false;
    this.installButton = null;
    this.modal = null;
    this.floatingButton = null;
    
    this.init();
  }

  init() {
    try {
      this.detectDevice();
      this.createModal();
      this.createFloatingButton();
      this.setupEventListeners();
      this.checkInstallability();
      console.log('PWA Installer: Initialized successfully', {
        isIOS: this.isIOS,
        isStandalone: this.isStandalone
      });
    } catch (error) {
      console.error('PWA Installer: Error during initialization:', error);
    }
  }

  detectDevice() {
    // Detectar iOS
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Detectar si ya está instalada como PWA
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;
    
    console.log('PWA: Device detection:', {
      userAgent: navigator.userAgent.substring(0, 50),
      isIOS: this.isIOS,
      isStandalone: this.isStandalone,
      standalone: window.navigator.standalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches
    });
  }

  createModal() {
    // Verificar que document.body exista
    if (!document.body) {
      console.warn('PWA: document.body not ready, retrying in 500ms');
      setTimeout(() => this.createModal(), 500);
      return;
    }

    // Verificar si el modal ya existe
    if (document.getElementById('pwa-modal')) {
      this.modal = document.getElementById('pwa-modal');
      return;
    }

    const modalHTML = `
      <div class="pwa-modal-overlay" id="pwa-modal">
        <div class="pwa-modal-content">
          <button class="pwa-modal-close" id="pwa-modal-close">
            <i class="fas fa-times"></i>
          </button>
          
          <div class="pwa-modal-header">
            <div class="pwa-modal-icon">
              <i class="fas fa-mobile-alt"></i>
            </div>
            <h3 id="pwa-modal-title">Instalar Aplicación</h3>
            <p id="pwa-modal-subtitle">Accede más rápido y disfruta de una mejor experiencia</p>
          </div>
          
          <div class="pwa-modal-body">
            <!-- Contenido para dispositivos normales -->
            <div class="pwa-install-normal" id="pwa-install-normal">
              <div class="pwa-benefits">
                <div class="pwa-benefit">
                  <i class="fas fa-bolt"></i>
                  <span>Acceso más rápido</span>
                </div>
                <div class="pwa-benefit">
                  <i class="fas fa-wifi"></i>
                  <span>Funciona sin conexión</span>
                </div>
                <div class="pwa-benefit">
                  <i class="fas fa-bell"></i>
                  <span>Notificaciones push</span>
                </div>
                <div class="pwa-benefit">
                  <i class="fas fa-home"></i>
                  <span>En tu pantalla de inicio</span>
                </div>
              </div>
              
              <!-- Opción de notificaciones -->
              <div class="pwa-notifications-option" id="pwa-notifications-option" style="display: none;">
                <label class="pwa-checkbox-label">
                  <input type="checkbox" id="pwa-enable-notifications" checked>
                  <span class="pwa-checkbox-custom"></span>
                  <span class="pwa-checkbox-text">
                    <i class="fas fa-bell"></i>
                    Activar notificaciones push
                  </span>
                </label>
                <p class="pwa-notifications-description">
                  Recibe noticias, eventos y actualizaciones importantes
                </p>
              </div>
              
              <div class="pwa-modal-buttons">
                <button class="pwa-install-btn" id="pwa-install-btn">
                  <i class="fas fa-download"></i>
                  <span>Instalar Aplicación</span>
                </button>
                <button class="pwa-dismiss-btn" id="pwa-dismiss-btn">
                  <span>No, gracias</span>
                </button>
              </div>
            </div>
            
            <!-- Contenido para iOS -->
            <div class="pwa-install-ios" id="pwa-install-ios" style="display: none;">
              <div class="pwa-ios-steps">
                <div class="pwa-ios-step">
                  <div class="pwa-step-number">1</div>
                  <div class="pwa-step-content">
                    <p>Toca el botón <strong>Compartir</strong></p>
                    <div class="pwa-ios-icon">
                      <i class="fas fa-share"></i>
                    </div>
                  </div>
                </div>
                <div class="pwa-ios-step">
                  <div class="pwa-step-number">2</div>
                  <div class="pwa-step-content">
                    <p>Selecciona <strong>"Añadir a pantalla de inicio"</strong></p>
                    <div class="pwa-ios-icon">
                      <i class="fas fa-plus-square"></i>
                    </div>
                  </div>
                </div>
                <div class="pwa-ios-step">
                  <div class="pwa-step-number">3</div>
                  <div class="pwa-step-content">
                    <p>Confirma tocando <strong>"Añadir"</strong></p>
                    <div class="pwa-ios-icon">
                      <i class="fas fa-check"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      this.modal = document.getElementById('pwa-modal');
      console.log('PWA: Modal created successfully');
    } catch (error) {
      console.error('PWA: Error creating modal:', error);
    }
  }

  createFloatingButton() {
    const buttonHTML = `
      <div class="pwa-floating-button" id="pwa-floating-button">
        <div class="pwa-floating-icon">
          <i class="fas fa-download"></i>
        </div>
        <div class="pwa-floating-text">
          <span>Instalar App</span>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', buttonHTML);
    this.floatingButton = document.getElementById('pwa-floating-button');
  }

  setupEventListeners() {
    // Event listener para el prompt de instalación (Chrome/Edge/Android)
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA: beforeinstallprompt event fired');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showFloatingButton();
      
      // Mostrar modal automáticamente después de 5 segundos
      setTimeout(() => {
        this.showModalAutomatically();
      }, 5000);
    });

    // Event listener para cuando la app se instala
    window.addEventListener('appinstalled', (e) => {
      console.log('PWA: App installed successfully');
      this.hideFloatingButton();
      this.hideModal();
      this.showToast('¡Aplicación instalada correctamente!', 'success');
    });

    // Botón flotante
    if (this.floatingButton) {
      this.floatingButton.addEventListener('click', () => {
        this.showModal();
      });
    }

    // Botón de instalación en el modal
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        this.installApp();
      });
    }

    // Botón "No, gracias" en el modal
    const dismissBtn = document.getElementById('pwa-dismiss-btn');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        this.dismissModal();
      });
    }

    // Botón de cerrar modal
    const closeBtn = document.getElementById('pwa-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.dismissModal();
      });
    }

    // Cerrar modal al hacer clic fuera
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.dismissModal();
        }
      });
    }
  }

  checkInstallability() {
    // Si ya está instalada, no mostrar nada
    if (this.isStandalone) {
      console.log('PWA: App already installed');
      return;
    }

    // Mostrar botón flotante rápidamente (1 segundo)
    setTimeout(() => {
      this.showFloatingButton();
    }, 1000);

    // Para iOS: mostrar modal FORZOSAMENTE después de 3 segundos
    // Safari no tiene beforeinstallprompt, así que siempre mostramos el modal manual
    if (this.isIOS) {
      console.log('PWA: iOS detected, scheduling modal in 3 seconds');
      
      // Intento 1: a los 3 segundos
      setTimeout(() => {
        console.log('PWA: Attempting to show iOS modal (attempt 1)');
        this.showModalAutomatically();
      }, 3000);
      
      // Intento 2: a los 6 segundos (fallback si el primero falla)
      setTimeout(() => {
        if (!this.modal || !this.modal.classList.contains('active')) {
          console.log('PWA: Attempting to show iOS modal (attempt 2 - fallback)');
          this.showModalAutomatically();
        }
      }, 6000);
      
      // Intento 3: a los 10 segundos (último recurso)
      setTimeout(() => {
        if (!this.modal || !this.modal.classList.contains('active')) {
          console.log('PWA: Attempting to show iOS modal (attempt 3 - last resort)');
          this.showModalAutomatically();
        }
      }, 10000);
      
    } else {
      // Para Chrome/Edge/Android: si no llega beforeinstallprompt en 5 segundos,
      // mostrar modal de todas formas
      setTimeout(() => {
        if (!this.deferredPrompt) {
          this.showModalAutomatically();
        }
      }, 5000);
    }
  }

  showModal() {
    // Verificar que el modal exista
    if (!this.modal) {
      console.warn('PWA: Modal not found, attempting to recreate');
      this.createModal();
      if (!this.modal) {
        console.error('PWA: Failed to create modal');
        return;
      }
    }

    try {
      // Configurar contenido según el dispositivo
      const normalContent = document.getElementById('pwa-install-normal');
      const iosContent = document.getElementById('pwa-install-ios');
      const notificationsOption = document.getElementById('pwa-notifications-option');
      const modalTitle = document.getElementById('pwa-modal-title');
      const modalSubtitle = document.getElementById('pwa-modal-subtitle');

      if (this.isIOS) {
        if (normalContent) normalContent.style.display = 'none';
        if (iosContent) iosContent.style.display = 'block';
        if (modalTitle) modalTitle.textContent = 'Añadir a Pantalla de Inicio';
        if (modalSubtitle) modalSubtitle.textContent = 'Sigue estos pasos para instalar la aplicación';
      } else {
        if (normalContent) normalContent.style.display = 'block';
        if (iosContent) iosContent.style.display = 'none';
        if (modalTitle) modalTitle.textContent = 'Instalar Aplicación';
        if (modalSubtitle) modalSubtitle.textContent = 'Accede más rápido y disfruta de una mejor experiencia';
        
        // Mostrar opción de notificaciones si OneSignal está disponible
        this.checkNotificationAvailability(notificationsOption);
      }

      this.modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      console.log('PWA: Modal shown successfully');
    } catch (error) {
      console.error('PWA: Error showing modal:', error);
    }
  }

  async checkNotificationAvailability(notificationsOption) {
    if (!notificationsOption) return;

    // Verificar si las notificaciones están soportadas
    if (!('Notification' in window)) {
      notificationsOption.style.display = 'none';
      return;
    }

    // Verificar si OneSignal está disponible
    if (typeof window.oneSignalManager === 'undefined') {
      notificationsOption.style.display = 'none';
      return;
    }

    // Esperar un poco a que OneSignal se inicialice
    await new Promise(resolve => setTimeout(resolve, 500));

    // Si OneSignal está inicializado, mostrar la opción
    if (window.oneSignalManager.initialized) {
      notificationsOption.style.display = 'block';
    } else {
      notificationsOption.style.display = 'none';
    }
  }

  hideModal() {
    if (!this.modal) return;
    
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  showModalAutomatically() {
    // Mostrar modal automáticamente
    this.showModal();
  }

  dismissModal() {
    // Cerrar modal sin recordar estado
    this.hideModal();
    console.log('PWA: Modal dismissed by user');
  }

  showFloatingButton() {
    if (!this.floatingButton || this.isStandalone) return;
    
    // Mostrar inmediatamente sin delay adicional
    this.floatingButton.classList.add('visible');
    console.log('PWA: Floating button shown');
  }

  hideFloatingButton() {
    if (!this.floatingButton) return;
    
    this.floatingButton.classList.remove('visible');
  }

  async installApp() {
    if (!this.deferredPrompt) {
      console.log('PWA: No deferred prompt available');
      return;
    }

    try {
      // Verificar si el usuario quiere activar notificaciones
      const enableNotifications = document.getElementById('pwa-enable-notifications');
      const shouldEnableNotifications = enableNotifications && enableNotifications.checked;
      
      // Mostrar el prompt de instalación
      this.deferredPrompt.prompt();
      
      // Esperar la respuesta del usuario
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log(`PWA: User response: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
        
        // Si el usuario aceptó y quiere notificaciones, solicitarlas
        if (shouldEnableNotifications) {
          setTimeout(() => {
            this.requestNotificationPermission();
          }, 1000);
        }
      } else {
        console.log('PWA: User dismissed the install prompt');
      }
      
      // Limpiar el prompt
      this.deferredPrompt = null;
      this.hideModal();
      
    } catch (error) {
      console.error('PWA: Error during installation:', error);
      this.showToast('Error al instalar la aplicación', 'error');
    }
  }

  async requestNotificationPermission() {
    // Verificar si OneSignal está disponible
    if (typeof window.oneSignalManager === 'undefined') {
      console.log('PWA: OneSignal not available');
      return;
    }

    try {
      // Esperar a que OneSignal esté inicializado
      let attempts = 0;
      while (!window.oneSignalManager.initialized && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.oneSignalManager.initialized) {
        console.log('PWA: OneSignal not initialized');
        return;
      }

      // Solicitar permisos de notificación
      const granted = await window.oneSignalManager.requestPermission();
      
      if (granted) {
        console.log('PWA: Notification permission granted');
        this.showToast('¡Notificaciones activadas correctamente!', 'success');
      } else {
        console.log('PWA: Notification permission denied');
      }
    } catch (error) {
      console.error('PWA: Error requesting notification permission:', error);
    }
  }

  showToast(message, type = 'info') {
    // Crear toast notification
    const toast = document.createElement('div');
    toast.className = `pwa-toast pwa-toast-${type}`;
    toast.innerHTML = `
      <div class="pwa-toast-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Mostrar toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

    // Ocultar toast después de 3 segundos
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
}

// Inicializar PWA Installer cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.pwaInstaller = new PWAInstaller();
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWAInstaller;
}