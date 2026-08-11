/**
 * Title Updater - Actualiza automáticamente los títulos de las páginas
 * usando el nombre del proyecto desde la API de IPStream
 */

class TitleUpdater {
  constructor() {
    this.projectName = null;
    this.init();
  }

  async init() {
    try {
      await this.loadProjectName();
      this.updateTitle();
    } catch (error) {
      console.error('TitleUpdater: Error loading project name:', error);
      // Fallback al config local si falla la API
      await this.loadProjectNameFromConfig();
      this.updateTitle();
    }
  }

  async loadProjectName() {
    try {
      // Importar dinámicamente la función de API
      const { getBasicData } = await import('./api.js');
      const basicData = await getBasicData();
      
      // Usar el nombre de la API como prioridad principal
      this.projectName = basicData.projectName || basicData.name;
      console.log('TitleUpdater: Project name loaded from API:', this.projectName);
    } catch (error) {
      console.error('TitleUpdater: Error loading from API:', error);
      throw error;
    }
  }

  async loadProjectNameFromConfig() {
    try {
      const response = await fetch('/config/config.json');
      const config = await response.json();
      this.projectName = config.project_name;
      console.log('TitleUpdater: Project name loaded from config (fallback):', this.projectName);
    } catch (error) {
      console.error('TitleUpdater: Error loading config:', error);
      // Último fallback
      this.projectName = 'Radio Stream';
    }
  }

  updateTitle() {
    if (!this.projectName) {
      console.warn('TitleUpdater: No project name available');
      return;
    }

    // Actualizar el título de la página
    document.title = this.projectName;
    console.log('TitleUpdater: Title updated to:', this.projectName);

    // También actualizar meta tags relacionados si existen
    this.updateMetaTags();
  }

  updateMetaTags() {
    // Actualizar meta application-name si existe
    const appNameMeta = document.querySelector('meta[name="application-name"]');
    if (appNameMeta) {
      appNameMeta.setAttribute('content', this.projectName);
    }

    // Actualizar meta apple-mobile-web-app-title si existe
    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitleMeta) {
      appleTitleMeta.setAttribute('content', this.projectName);
    }

    // Actualizar meta og:title si existe
    const ogTitleMeta = document.querySelector('meta[property="og:title"]');
    if (ogTitleMeta) {
      ogTitleMeta.setAttribute('content', this.projectName);
    }

    // Actualizar meta twitter:title si existe
    const twitterTitleMeta = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitleMeta) {
      twitterTitleMeta.setAttribute('content', this.projectName);
    }

    // Actualizar meta og:site_name si existe
    const ogSiteNameMeta = document.querySelector('meta[property="og:site_name"]');
    if (ogSiteNameMeta) {
      ogSiteNameMeta.setAttribute('content', this.projectName);
    }

    console.log('TitleUpdater: Meta tags updated');
  }
}

// Inicializar el actualizador de títulos cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.titleUpdater = new TitleUpdater();
  });
} else {
  // Si el DOM ya está cargado
  window.titleUpdater = new TitleUpdater();
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TitleUpdater;
}