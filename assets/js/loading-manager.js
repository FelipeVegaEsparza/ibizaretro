import { getBasicData } from './api.js';
import { escapeHtml } from './utils.js';

/**
 * Loading Manager - Sistema de precarga profesional
 * Actualiza la pantalla de carga con datos dinámicos de la API
 */

class LoadingManager {
  constructor() {
    this.loadingOverlay = null;
    this.loadingTitle = null;
    this.loadingSubtitle = null;
    this.loadingLogo = null;
    this.progressBar = null;
    this.currentProgress = 0;
    this.isInitialized = false;
  }

  init() {
    try {
      this.loadingOverlay = document.getElementById('loading-overlay');
      this.loadingTitle = document.getElementById('loading-title');
      this.loadingSubtitle = document.getElementById('loading-subtitle');
      this.loadingLogo = document.getElementById('loading-logo-img');
      this.progressBar = document.querySelector('.progress-bar');
      
      if (this.loadingOverlay) {
        this.isInitialized = true;
        this.startLoading();
      }
    } catch (error) {
      console.error('LoadingManager: Error en inicialización:', error);
      this.forceHide();
    }
  }

  async startLoading() {
    try {
      this.show();
      await this.loadBasicData();
      await this.simulateProgress();
    } catch (error) {
      console.error('LoadingManager: Error en startLoading:', error);
      setTimeout(() => this.hide(), 1000);
    }
  }

  async loadBasicData() {
    try {
      this.updateProgress(10, 'Iniciando aplicación...');
      await this.delay(600);
      
      this.updateProgress(25, 'Conectando con IPStream...');
      await this.delay(500);
      
      // Usar la API mejorada con retry y cache
      const data = await getBasicData();
      
      this.updateProgress(65, 'Personalizando experiencia...');
      await this.delay(400);
      
      // Actualizar información en la pantalla de carga
      if (data.projectName) {
        this.updateTitle(`Cargando ${escapeHtml(data.projectName)}`);
        await this.delay(300);
      }
      
      if (data.projectDescription) {
        this.updateSubtitle(escapeHtml(data.projectDescription));
        await this.delay(400);
      }
      
      // Actualizar logo si está disponible
      if (data.logoUrl) {
        this.updateLogo(`https://dashboard.ipstream.cl${data.logoUrl}`);
        await this.delay(300);
      }
      
      this.updateProgress(85, 'Aplicando configuración...');
      await this.delay(500);
      
    } catch (error) {
      console.error('LoadingManager: Error cargando datos básicos:', error);
      this.updateSubtitle('Preparando la experiencia...');
      await this.delay(500);
    }
  }

  async simulateProgress() {
    this.updateProgress(95, 'Preparando interfaz...');
    await this.delay(400);
    
    this.updateProgress(100, '¡Listo para comenzar!');
    await this.delay(600);
    
    this.hide();
  }

  updateProgress(percentage, message = null) {
    this.currentProgress = percentage;
    
    if (this.progressBar) {
      this.progressBar.style.width = `${percentage}%`;
    }
    
    if (message && this.loadingSubtitle) {
      this.loadingSubtitle.textContent = message;
    }
  }

  updateTitle(title) {
    if (this.loadingTitle) {
      this.loadingTitle.textContent = title;
    }
  }

  updateSubtitle(subtitle) {
    if (this.loadingSubtitle) {
      this.loadingSubtitle.textContent = subtitle;
    }
  }

  updateLogo(logoUrl) {
    if (this.loadingLogo) {
      const img = new Image();
      img.onload = () => {
        this.loadingLogo.src = logoUrl;
        this.loadingLogo.alt = 'Logo de la radio';
      };
      img.onerror = () => {
        console.warn('LoadingManager: Error cargando logo');
      };
      img.src = logoUrl;
    }
  }

  show() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.remove('hidden');
      this.loadingOverlay.style.display = 'flex';
    }
  }

  hide() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add('hidden');
      setTimeout(() => {
        if (this.loadingOverlay) {
          this.loadingOverlay.style.display = 'none';
        }
      }, 500);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  forceHide() {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = 'none';
    } else {
      const overlay = document.getElementById('loading-overlay');
      if (overlay) overlay.style.display = 'none';
    }
  }

  static emergencyHide() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 500);
    }
  }
}

// Crear instancia global
window.loadingManager = new LoadingManager();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.loadingManager.init(), 100);
  });
} else {
  setTimeout(() => window.loadingManager.init(), 100);
}

// Fallback de emergencia
setTimeout(() => {
  if (window.loadingManager && window.loadingManager.loadingOverlay) {
    const overlay = window.loadingManager.loadingOverlay;
    if (overlay && !overlay.classList.contains('hidden')) {
      window.loadingManager.forceHide();
    }
  }
}, 10000);

export default LoadingManager;
