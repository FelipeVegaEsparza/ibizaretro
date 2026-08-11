/**
 * Meta Updater - Actualiza automáticamente los meta tags para compartir en redes sociales
 * usando los datos del proyecto desde la API de IPStream
 */

class MetaUpdater {
  constructor() {
    this.projectData = null;
    this.init();
  }

  async init() {
    try {
      await this.loadProjectData();
      this.updateMetaTags();
    } catch (error) {
      console.error('MetaUpdater: Error loading project data:', error);
    }
  }

  async loadProjectData() {
    try {
      // Importar dinámicamente la función de API
      const { getBasicData } = await import('./api.js');
      const basicData = await getBasicData();
      
      this.projectData = {
        name: basicData.projectName || basicData.name || 'Radio Stream',
        description: basicData.projectDescription || 'Escucha nuestra radio online en vivo. Música, noticias y entretenimiento las 24 horas del día.',
        logoUrl: basicData.logoUrl ? `https://dashboard.ipstream.cl${basicData.logoUrl}` : '/assets/icons/icon-512x512.png',
        coverUrl: basicData.coverUrl ? `https://dashboard.ipstream.cl${basicData.coverUrl}` : '/assets/icons/icon-512x512.png'
      };
      
      console.log('MetaUpdater: Project data loaded:', this.projectData);
    } catch (error) {
      console.error('MetaUpdater: Error loading from API:', error);
      // Fallback data
      this.projectData = {
        name: 'Radio Stream',
        description: 'Escucha nuestra radio online en vivo. Música, noticias y entretenimiento las 24 horas del día.',
        logoUrl: '/assets/icons/icon-512x512.png',
        coverUrl: '/assets/icons/icon-512x512.png'
      };
    }
  }

  updateMetaTags() {
    if (!this.projectData) {
      console.warn('MetaUpdater: No project data available');
      return;
    }

    const currentUrl = window.location.href;

    // Actualizar título de la página
    document.title = this.projectData.name;

    // Actualizar meta description
    this.updateMetaTag('name', 'description', this.projectData.description);
    this.updateMetaTag('name', 'author', this.projectData.name);

    // Actualizar PWA meta tags
    this.updateMetaTag('name', 'application-name', this.projectData.name);
    this.updateMetaTag('name', 'apple-mobile-web-app-title', this.projectData.name);

    // Actualizar Open Graph meta tags
    this.updateMetaTag('property', 'og:title', this.projectData.name);
    this.updateMetaTag('property', 'og:description', this.projectData.description);
    this.updateMetaTag('property', 'og:url', currentUrl);
    this.updateMetaTag('property', 'og:image', this.projectData.coverUrl);
    this.updateMetaTag('property', 'og:site_name', this.projectData.name);

    // Actualizar Twitter Card meta tags
    this.updateMetaTag('name', 'twitter:title', this.projectData.name);
    this.updateMetaTag('name', 'twitter:description', this.projectData.description);
    this.updateMetaTag('name', 'twitter:image', this.projectData.coverUrl);

    console.log('MetaUpdater: Meta tags updated successfully');
  }

  updateMetaTag(attribute, name, content) {
    let meta = document.querySelector(`meta[${attribute}="${name}"]`);
    
    if (meta) {
      meta.setAttribute('content', content);
    } else {
      // Crear el meta tag si no existe
      meta = document.createElement('meta');
      meta.setAttribute(attribute, name);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    }
  }

  // Método para actualizar meta tags específicos de noticias
  updateNewsMetaTags(article) {
    if (!article) return;

    const newsTitle = `${article.name} - ${this.projectData.name}`;
    const newsDescription = article.shortText || article.longText || this.projectData.description;
    const newsImage = article.imageUrl ? `https://dashboard.ipstream.cl${article.imageUrl}` : this.projectData.coverUrl;
    const newsUrl = window.location.href;

    // Actualizar título
    document.title = newsTitle;

    // Actualizar meta tags para la noticia específica
    this.updateMetaTag('name', 'description', newsDescription);
    this.updateMetaTag('property', 'og:title', newsTitle);
    this.updateMetaTag('property', 'og:description', newsDescription);
    this.updateMetaTag('property', 'og:url', newsUrl);
    this.updateMetaTag('property', 'og:image', newsImage);
    this.updateMetaTag('property', 'og:type', 'article');
    this.updateMetaTag('name', 'twitter:title', newsTitle);
    this.updateMetaTag('name', 'twitter:description', newsDescription);
    this.updateMetaTag('name', 'twitter:image', newsImage);

    console.log('MetaUpdater: News meta tags updated for:', article.name);
  }

  // Método para restaurar meta tags originales
  restoreOriginalMetaTags() {
    this.updateMetaTags();
  }
}

// Inicializar el actualizador de meta tags cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.metaUpdater = new MetaUpdater();
  });
} else {
  // Si el DOM ya está cargado
  window.metaUpdater = new MetaUpdater();
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MetaUpdater;
}