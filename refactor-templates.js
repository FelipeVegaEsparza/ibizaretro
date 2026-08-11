const fs = require('fs');
const path = require('path');

const templatesDir = 'F:\\Radios\\app-pwa-hostreams\\templates';
const templates = [
  'burbujas', 'carmesi', 'clasico', 'coffee', 'cyberpunk',
  'dark', 'esmeralda', 'indigo', 'magazine', 'magenta',
  'oceano', 'petroleo', 'playlist', 'purpura', 'sobrio',
  'sunset', 'turquesa'
];

// Template base para todos los templates simples (sin contenido adicional)
const simpleTemplate = (templateName, className) => `
/**
 * Template ${templateName.charAt(0).toUpperCase() + templateName.slice(1)} - Refactorizado usando TemplateBase
 * Este template solo se encarga del renderizado visual
 * Toda la lógica de datos y audio está en TemplateBase
 */
import TemplateBase from '/assets/js/template-base.js';

class ${className}Template extends TemplateBase {
  constructor() {
    super({
      audioElementId: 'radio-audio',
      playButtonId: 'play-btn',
      volumeSliderId: 'volume-slider',
      defaultVolume: 50,
      socialContainerIds: ['social-links', 'footer-social']
    });
  }

  async init() {
    await super.init();
    console.log('${className}Template: Template fully initialized! 🚀');
  }

  // Sobrescribir: Actualizar display de canción actual
  updateCurrentSongDisplay(songData) {
    super.updateCurrentSongDisplay(songData);
    
    // Actualizar fondo con artwork si existe
    const bgCover = document.getElementById('bg-cover');
    if (bgCover && songData.art) {
      bgCover.style.backgroundImage = \`url(\${songData.art})\`;
    }
  }

  // Sobrescribir: Cuando se reproduce audio
  onAudioPlay() {
    super.onAudioPlay();
    
    // Iniciar animaciones específicas
    const visualizer = document.getElementById('audio-visualizer');
    if (visualizer) {
      visualizer.classList.add('playing');
    }
  }

  // Sobrescribir: Cuando se pausa audio
  onAudioPause() {
    super.onAudioPause();
    
    // Detener animaciones
    const visualizer = document.getElementById('audio-visualizer');
    if (visualizer) {
      visualizer.classList.remove('playing');
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.${templateName}Template = new ${className}Template();
  } catch (error) {
    console.error('${className}Template: Error creating instance:', error);
  }
});

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
  if (window.${templateName}Template) {
    window.${templateName}Template.destroy();
  }
});

export default ${className}Template;
`;

// Template para templates con contenido (noticias, programas, etc.)
const contentTemplate = (templateName, className) => `
/**
 * Template ${templateName.charAt(0).toUpperCase() + templateName.slice(1)} - Refactorizado usando TemplateBase
 * Este template solo se encarga del renderizado visual
 * Toda la lógica de datos y audio está en TemplateBase
 */
import TemplateBase from '/assets/js/template-base.js';
import { getDataManager } from '/assets/js/data-manager.js';

class ${className}Template extends TemplateBase {
  constructor() {
    super({
      audioElementId: 'radio-audio',
      playButtonId: 'play-btn',
      volumeSliderId: 'volume-slider',
      defaultVolume: 50,
      socialContainerIds: ['social-links', 'footer-social'],
      customDomIds: {
        heroCarousel: 'hero-carousel',
        breakingNews: 'breaking-news',
        featuredNews: 'featured-news',
        programsTimeline: 'programs-timeline',
        sponsorsCarousel: 'sponsors-carousel'
      }
    });
    
    this.heroSwiper = null;
    this.sponsorsSwiper = null;
  }

  async init() {
    await super.init();
    
    try {
      await this.loadAllContent();
      this.setupCarousels();
      this.setupNavigation();
      this.setupModals();
      this.setupAnimations();
      
      console.log('${className}Template: Template fully initialized! 🚀');
    } catch (error) {
      console.error('${className}Template: Error in template-specific init:', error);
    }
  }

  // Cargar todo el contenido
  async loadAllContent() {
    try {
      const dataManager = getDataManager();
      
      await Promise.all([
        this.loadHeroCarousel(),
        this.loadFeaturedNews(),
        this.loadProgramsTimeline(),
        this.loadSponsorsCarousel()
      ]);
    } catch (error) {
      console.error('${className}Template: Error loading content:', error);
    }
  }

  // Cargar hero carousel
  async loadHeroCarousel() {
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNews(1, 5);
      
      if (news.data && news.data.length > 0) {
        this.renderHeroCarousel(news.data);
      }
    } catch (error) {
      console.error('${className}Template: Error loading hero carousel:', error);
    }
  }

  // Renderizar hero carousel
  renderHeroCarousel(news) {
    const container = document.getElementById('hero-carousel');
    if (!container) return;

    const slidesHtml = news.map((item, index) => \`
      <div class="swiper-slide" data-index="\${index}">
        <div class="hero-slide" style="background-image: url('\${item.imageUrl || ''}')">
          <div class="hero-overlay"></div>
          <div class="hero-content">
            <span class="hero-category">Noticia</span>
            <h2 class="hero-title">\${item.name}</h2>
            <p class="hero-description">\${item.shortText || ''}</p>
          </div>
        </div>
      </div>
    \`).join('');

    container.innerHTML = \`
      <div class="swiper-wrapper">\${slidesHtml}</div>
      <div class="swiper-pagination"></div>
    \`;
  }

  // Cargar noticias destacadas
  async loadFeaturedNews() {
    try {
      const dataManager = getDataManager();
      const news = await dataManager.loadNews(1, 6);
      
      if (news.data && news.data.length > 0) {
        this.renderFeaturedNews(news.data);
      }
    } catch (error) {
      console.error('${className}Template: Error loading featured news:', error);
    }
  }

  // Renderizar noticias destacadas
  renderFeaturedNews(news) {
    const container = document.getElementById('featured-news');
    if (!container) return;

    const newsHtml = news.map(item => \`
      <article class="news-card">
        <div class="news-image">
          <img src="\${item.imageUrl || '/assets/images/default-news.jpg'}" alt="\${item.name}" loading="lazy">
        </div>
        <div class="news-content">
          <h3 class="news-title">\${item.name}</h3>
          <p class="news-excerpt">\${item.shortText || ''}</p>
        </div>
      </article>
    \`).join('');

    container.innerHTML = newsHtml;
  }

  // Cargar timeline de programas
  async loadProgramsTimeline() {
    try {
      const dataManager = getDataManager();
      const programs = await dataManager.loadPrograms();
      
      if (programs && programs.length > 0) {
        this.renderProgramsTimeline(programs);
      }
    } catch (error) {
      console.error('${className}Template: Error loading programs:', error);
    }
  }

  // Renderizar timeline de programas
  renderProgramsTimeline(programs) {
    const container = document.getElementById('programs-timeline');
    if (!container) return;

    // Organizar programas por día
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const organized = {};
    
    days.forEach(day => {
      organized[day] = programs.filter(p => p.day === day);
    });

    // Renderizar
    const timelineHtml = days.map(day => {
      const dayPrograms = organized[day];
      if (dayPrograms.length === 0) return '';
      
      return \`
        <div class="day-section">
          <h3 class="day-title">\${day}</h3>
          <div class="programs-list">
            \${dayPrograms.map(program => \`
              <div class="program-item">
                <span class="program-time">\${program.startTime}</span>
                <span class="program-name">\${program.name}</span>
              </div>
            \`).join('')}
          </div>
        </div>
      \`;
    }).join('');

    container.innerHTML = timelineHtml;
  }

  // Cargar sponsors
  async loadSponsorsCarousel() {
    try {
      const dataManager = getDataManager();
      const sponsors = await dataManager.loadSponsors();
      
      if (sponsors && sponsors.length > 0) {
        this.renderSponsorsCarousel(sponsors);
      }
    } catch (error) {
      console.error('${className}Template: Error loading sponsors:', error);
    }
  }

  // Renderizar sponsors
  renderSponsorsCarousel(sponsors) {
    const container = document.getElementById('sponsors-carousel');
    if (!container) return;

    const sponsorsHtml = sponsors.map(sponsor => \`
      <div class="swiper-slide">
        <div class="sponsor-card">
          <img src="\${sponsor.logoUrl || ''}" alt="\${sponsor.name}" loading="lazy">
          <h4>\${sponsor.name}</h4>
        </div>
      </div>
    \`).join('');

    container.innerHTML = \`
      <div class="swiper-wrapper">\${sponsorsHtml}</div>
      <div class="swiper-pagination"></div>
    \`;
  }

  // Setup de carouseles
  setupCarousels() {
    if (typeof Swiper !== 'undefined') {
      this.heroSwiper = new Swiper('#hero-carousel', {
        loop: true,
        autoplay: {
          delay: 5000,
          disableOnInteraction: false
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true
        }
      });

      this.sponsorsSwiper = new Swiper('#sponsors-carousel', {
        loop: true,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false
        },
        slidesPerView: 'auto',
        spaceBetween: 30
      });
    }
  }

  // Setup de navegación
  setupNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (menuToggle && navMenu) {
      menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });
      
      document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
          navMenu.classList.remove('active');
        }
      });
    }
  }

  // Setup de modales
  setupModals() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modals.forEach(modal => modal.classList.remove('active'));
      }
    });
  }

  // Setup de animaciones
  setupAnimations() {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        once: true,
        offset: 100
      });
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.${templateName}Template = new ${className}Template();
  } catch (error) {
    console.error('${className}Template: Error creating instance:', error);
  }
});

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
  if (window.${templateName}Template) {
    window.${templateName}Template.destroy();
  }
});

export default ${className}Template;
`;

// Función para convertir nombre de template a nombre de clase
function toClassName(template) {
  return template.charAt(0).toUpperCase() + template.slice(1);
}

// Templates simples (solo reproductor, sin contenido adicional)
const simpleTemplates = ['burbujas', 'carmesi', 'clasico', 'coffee', 'cyberpunk', 'dark'];

// Templates con contenido (noticias, programas, etc.)
const contentTemplates = ['esmeralda', 'indigo', 'magazine', 'magenta', 'oceano', 
                          'petroleo', 'playlist', 'purpura', 'sobrio', 'sunset', 'turquesa'];

console.log('Iniciando refactorización de templates...\n');

// Procesar templates simples
simpleTemplates.forEach(template => {
  const filePath = path.join(templatesDir, template, 'assets', 'js', 'main.js');
  const className = toClassName(template);
  const content = simpleTemplate(template, className);
  
  try {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Template "${template}" refactorizado (simple)`);
  } catch (error) {
    console.error(`❌ Error refactorizando "${template}":`, error.message);
  }
});

// Procesar templates con contenido
contentTemplates.forEach(template => {
  const filePath = path.join(templatesDir, template, 'assets', 'js', 'main.js');
  const className = toClassName(template);
  const content = contentTemplate(template, className);
  
  try {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Template "${template}" refactorizado (con contenido)`);
  } catch (error) {
    console.error(`❌ Error refactorizando "${template}":`, error.message);
  }
});

console.log('\n🎉 Refactorización completada!');
console.log(`📊 Total: ${simpleTemplates.length + contentTemplates.length} templates refactorizados`);
