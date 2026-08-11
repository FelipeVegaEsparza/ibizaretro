/**
 * OneSignal Manager
 * Maneja la inicialización y gestión de notificaciones push con OneSignal
 */

import { getAllClientData } from './api.js';

class OneSignalManager {
  constructor() {
    this.initialized = false;
    this.oneSignalAppId = null;
    this.isSupported = false;
  }

  /**
   * Inicializa OneSignal si el cliente tiene configurado el App ID
   */
  async init() {
    try {
      // Verificar soporte de notificaciones
      if (!('Notification' in window)) {
        console.log('OneSignal: Notificaciones no soportadas en este navegador');
        return false;
      }

      this.isSupported = true;

      // Obtener datos del cliente incluyendo oneSignalAppId
      const clientData = await getAllClientData();
      
      if (!clientData.oneSignalAppId) {
        console.log('OneSignal: Cliente no tiene OneSignal configurado');
        return false;
      }

      this.oneSignalAppId = clientData.oneSignalAppId;

      // Cargar el SDK de OneSignal
      await this.loadOneSignalSDK();

      // Inicializar OneSignal
      window.OneSignal = window.OneSignal || [];
      window.OneSignal.push(() => {
        window.OneSignal.init({
          appId: this.oneSignalAppId,
          allowLocalhostAsSecureOrigin: window.location.hostname === 'localhost',
          notifyButton: {
            enable: false, // No usar el botón por defecto
          },
          welcomeNotification: {
            disable: true, // Desactivar notificación de bienvenida
          },
        });

        console.log('OneSignal: Inicializado correctamente');
        this.initialized = true;

        // Escuchar eventos
        this.setupEventListeners();
      });

      return true;
    } catch (error) {
      console.error('OneSignal: Error al inicializar', error);
      return false;
    }
  }

  /**
   * Carga el SDK de OneSignal dinámicamente
   */
  loadOneSignalSDK() {
    return new Promise((resolve, reject) => {
      if (window.OneSignal) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Configura los event listeners de OneSignal
   */
  setupEventListeners() {
    window.OneSignal.push(() => {
      // Cuando se muestra una notificación
      window.OneSignal.on('notificationDisplay', (event) => {
        console.log('OneSignal: Notificación mostrada', event);
      });

      // Cuando se hace clic en una notificación
      window.OneSignal.on('notificationClick', (event) => {
        console.log('OneSignal: Notificación clickeada', event);
      });

      // Cuando cambia el estado de suscripción
      window.OneSignal.on('subscriptionChange', (isSubscribed) => {
        console.log('OneSignal: Estado de suscripción cambió', isSubscribed);
        // Disparar evento personalizado para actualizar UI
        window.dispatchEvent(new CustomEvent('onesignal-subscription-changed', {
          detail: { isSubscribed }
        }));
      });
    });
  }

  /**
   * Verifica si el usuario está suscrito
   */
  async isSubscribed() {
    if (!this.initialized) {
      return false;
    }

    return new Promise((resolve) => {
      window.OneSignal.push(() => {
        window.OneSignal.isPushNotificationsEnabled((isEnabled) => {
          resolve(isEnabled);
        });
      });
    });
  }

  /**
   * Solicita permisos de notificación al usuario
   */
  async requestPermission() {
    if (!this.initialized) {
      console.error('OneSignal: No inicializado');
      return false;
    }

    try {
      return new Promise((resolve) => {
        window.OneSignal.push(() => {
          window.OneSignal.showSlidedownPrompt().then(() => {
            // Verificar si el usuario aceptó
            setTimeout(async () => {
              const isEnabled = await this.isSubscribed();
              resolve(isEnabled);
            }, 1000);
          });
        });
      });
    } catch (error) {
      console.error('OneSignal: Error al solicitar permisos', error);
      return false;
    }
  }

  /**
   * Obtiene el ID del usuario de OneSignal
   */
  async getUserId() {
    if (!this.initialized) {
      return null;
    }

    return new Promise((resolve) => {
      window.OneSignal.push(() => {
        window.OneSignal.getUserId((userId) => {
          resolve(userId);
        });
      });
    });
  }

  /**
   * Envía tags personalizados al usuario
   */
  async sendTags(tags) {
    if (!this.initialized) {
      return false;
    }

    return new Promise((resolve) => {
      window.OneSignal.push(() => {
        window.OneSignal.sendTags(tags).then(() => {
          console.log('OneSignal: Tags enviados', tags);
          resolve(true);
        }).catch((error) => {
          console.error('OneSignal: Error al enviar tags', error);
          resolve(false);
        });
      });
    });
  }

  /**
   * Verifica el estado de los permisos
   */
  async getPermissionState() {
    if (!this.isSupported) {
      return 'unsupported';
    }

    if (!this.initialized) {
      return 'not-initialized';
    }

    return new Promise((resolve) => {
      window.OneSignal.push(() => {
        window.OneSignal.getNotificationPermission((permission) => {
          resolve(permission); // 'default', 'granted', 'denied'
        });
      });
    });
  }
}

// Exportar instancia única
export const oneSignalManager = new OneSignalManager();
