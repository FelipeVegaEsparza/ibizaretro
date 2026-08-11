/**
 * SocialManager - Centraliza el manejo de redes sociales
 * Todos los templates usan esta clase
 */
class SocialManager {
  constructor(options = {}) {
    this.socialNetworks = [];
    this.containerIds = options.containerIds || ['social-links', 'footer-social'];
  }

  // Cargar y procesar datos de redes sociales
  loadSocialNetworks(socialData) {
    if (!socialData || Object.keys(socialData).length === 0) {
      console.log('SocialManager: No social networks configured');
      this.socialNetworks = [];
      return this;
    }

    const networks = [];

    if (socialData.facebook) {
      networks.push({ name: 'facebook', url: socialData.facebook });
    }
    if (socialData.instagram) {
      networks.push({ name: 'instagram', url: socialData.instagram });
    }
    if (socialData.x || socialData.twitter) {
      networks.push({ name: 'twitter', url: socialData.x || socialData.twitter });
    }
    if (socialData.youtube) {
      networks.push({ name: 'youtube', url: socialData.youtube });
    }
    if (socialData.tiktok) {
      networks.push({ name: 'tiktok', url: socialData.tiktok });
    }
    if (socialData.whatsapp) {
      const whatsappUrl = socialData.whatsapp.startsWith('http') 
        ? socialData.whatsapp 
        : `https://wa.me/${socialData.whatsapp.replace(/[^0-9]/g, '')}`;
      networks.push({ name: 'whatsapp', url: whatsappUrl });
    }
    if (socialData.telegram) {
      networks.push({ name: 'telegram', url: socialData.telegram });
    }
    if (socialData.linkedin) {
      networks.push({ name: 'linkedin', url: socialData.linkedin });
    }

    this.socialNetworks = networks;
    console.log('SocialManager: Loaded', networks.length, 'social networks');
    return this;
  }

  // Obtener icono FontAwesome para una red social
  getIcon(socialName) {
    const icons = {
      'facebook': 'fab fa-facebook-f',
      'twitter': 'fab fa-twitter',
      'x': 'fab fa-x-twitter',
      'instagram': 'fab fa-instagram',
      'youtube': 'fab fa-youtube',
      'tiktok': 'fab fa-tiktok',
      'whatsapp': 'fab fa-whatsapp',
      'telegram': 'fab fa-telegram',
      'linkedin': 'fab fa-linkedin-in'
    };

    return icons[socialName.toLowerCase()] || 'fas fa-link';
  }

  // Generar HTML para las redes sociales
  generateHTML(className = 'social-links') {
    if (this.socialNetworks.length === 0) {
      return '';
    }

    const linksHtml = this.socialNetworks.map(social => `
      <a href="${social.url}" target="_blank" title="${social.name}" class="social-link">
        <i class="${this.getIcon(social.name)}"></i>
      </a>
    `).join('');

    return `<div class="${className}">${linksHtml}</div>`;
  }

  // Renderizar en contenedores específicos
  render(containerIds = null) {
    const ids = containerIds || this.containerIds;
    const html = this.generateHTML();

    ids.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = html;
      }
    });

    return this;
  }

  // Renderizar con HTML personalizado
  renderCustom(containerId, htmlGenerator) {
    const container = document.getElementById(containerId);
    if (container && htmlGenerator) {
      container.innerHTML = htmlGenerator(this.socialNetworks, this.getIcon.bind(this));
    }
    return this;
  }

  // Obtener redes sociales como array
  getNetworks() {
    return this.socialNetworks;
  }

  // Verificar si hay redes sociales
  hasNetworks() {
    return this.socialNetworks.length > 0;
  }
}

export default SocialManager;
