/**
 * Notification Button Component
 * Botón para gestionar suscripciones a notificaciones push
 */

import { oneSignalManager } from './onesignal-manager.js';

export class NotificationButton {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('NotificationButton: Contenedor no encontrado');
      return;
    }

    this.button = null;
    this.isSubscribed = false;
    this.isLoading = true;
    this.isSupported = false;

    this.init();
  }

  async init() {
    // Verificar soporte
    this.isSupported = 'Notification' in window;

    if (!this.isSupported) {
      console.log('NotificationButton: Notificaciones no soportadas');
      return;
    }

    // Crear el botón
    this.render();

    // Esperar a que OneSignal esté listo
    await this.waitForOneSignal();

    // Verificar estado de suscripción
    await this.checkSubscriptionStatus();

    // Escuchar cambios en el estado de suscripción
    window.addEventListener('onesignal-subscription-changed', (event) => {
      this.isSubscribed = event.detail.isSubscribed;
      this.isLoading = false;
      this.render();
    });
  }

  async waitForOneSignal() {
    // Esperar hasta 5 segundos a que OneSignal se inicialice
    const maxAttempts = 50;
    let attempts = 0;

    while (!oneSignalManager.initialized && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!oneSignalManager.initialized) {
      console.log('NotificationButton: OneSignal no se inicializó');
      this.isSupported = false;
      this.container.innerHTML = '';
      return;
    }
  }

  async checkSubscriptionStatus() {
    try {
      this.isSubscribed = await oneSignalManager.isSubscribed();
      this.isLoading = false;
      this.render();
    } catch (error) {
      console.error('NotificationButton: Error al verificar suscripción', error);
      this.isLoading = false;
      this.render();
    }
  }

  async handleClick() {
    if (this.isSubscribed) {
      return; // Ya está suscrito, no hacer nada
    }

    this.isLoading = true;
    this.render();

    try {
      const success = await oneSignalManager.requestPermission();
      
      if (success) {
        this.isSubscribed = true;
        console.log('NotificationButton: Usuario suscrito correctamente');
      } else {
        console.log('NotificationButton: Usuario rechazó los permisos');
      }
    } catch (error) {
      console.error('NotificationButton: Error al solicitar permisos', error);
    } finally {
      this.isLoading = false;
      this.render();
    }
  }

  render() {
    if (!this.isSupported || !oneSignalManager.initialized) {
      this.container.innerHTML = '';
      return;
    }

    if (this.isLoading) {
      this.container.innerHTML = `
        <button class="notification-btn loading" disabled>
          <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </button>
      `;
      return;
    }

    if (this.isSubscribed) {
      this.container.innerHTML = `
        <div class="notification-badge active">
          <svg class="icon-bell" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="notification-text">Notificaciones activadas</span>
        </div>
      `;
    } else {
      this.container.innerHTML = `
        <button class="notification-btn" id="notification-subscribe-btn">
          <svg class="icon-bell" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="notification-text">Activar notificaciones</span>
        </button>
      `;

      // Agregar event listener al botón
      const btn = document.getElementById('notification-subscribe-btn');
      if (btn) {
        btn.addEventListener('click', () => this.handleClick());
      }
    }
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Función helper para inicializar el botón fácilmente
export function initNotificationButton(containerId) {
  return new NotificationButton(containerId);
}
