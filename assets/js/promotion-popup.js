// Promotion Popup Manager
class PromotionPopup {
  constructor() {
    this.overlay = null;
    this.popup = null;
    this.hasShown = false;
    this.storageKey = 'promotion_popup_shown';
    this.indexKey = 'promotion_current_index';
    this.showDelay = 30000; // 30 segundos
  }

  async init() {
    // Verificar si ya se mostró en esta sesión
    if (sessionStorage.getItem(this.storageKey)) {
      console.log('PromotionPopup: Ya se mostró en esta sesión');
      return;
    }

    try {
      // Obtener promociones de la API
      const promotions = await this.fetchPromotions();
      
      if (promotions && promotions.length > 0) {
        // Obtener el índice actual de localStorage (persiste entre sesiones)
        let currentIndex = parseInt(localStorage.getItem(this.indexKey) || '0');
        
        // Si el índice es mayor o igual al número de promociones, reiniciar
        if (currentIndex >= promotions.length) {
          currentIndex = 0;
        }
        
        // Mostrar la promoción correspondiente después del delay
        setTimeout(() => {
          this.show(promotions[currentIndex]);
          
          // Incrementar el índice para la próxima sesión
          const nextIndex = (currentIndex + 1) % promotions.length;
          localStorage.setItem(this.indexKey, nextIndex.toString());
        }, this.showDelay);
      }
    } catch (error) {
      console.error('PromotionPopup: Error al cargar promociones:', error);
    }
  }

  async fetchPromotions() {
    try {
      const configResponse = await fetch('/config/config.json');
      const config = await configResponse.json();
      
      const apiUrl = `${config.ipstream_base_url}/${config.clientId}/promotions`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('PromotionPopup: Error fetching promotions:', error);
      return null;
    }
  }

  show(promotion) {
    if (this.hasShown) return;
    
    this.hasShown = true;
    sessionStorage.setItem(this.storageKey, 'true');
    
    // Crear el overlay y popup
    this.createPopup(promotion);
    
    // Mostrar con animación
    setTimeout(() => {
      this.overlay.classList.add('active');
    }, 100);
  }

  createPopup(promotion) {
    // Crear overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'promotion-popup-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-labelledby', 'promotion-title');
    this.overlay.setAttribute('aria-describedby', 'promotion-description');
    
    // Construir la URL completa de la imagen
    const imageUrl = promotion.imageUrl.startsWith('http') 
      ? promotion.imageUrl 
      : `https://dashboard.ipstream.cl${promotion.imageUrl}`;
    
    // Crear popup
    this.overlay.innerHTML = `
      <div class="promotion-popup">
        <button class="promotion-popup-close" aria-label="Cerrar promoción">
          <i class="fas fa-times"></i>
        </button>
        <img src="${imageUrl}" alt="${this.escapeHtml(promotion.title)}" class="promotion-popup-image">
        <div class="promotion-popup-content">
          <h2 class="promotion-popup-title" id="promotion-title">${this.escapeHtml(promotion.title)}</h2>
          <p class="promotion-popup-description" id="promotion-description">${this.escapeHtml(promotion.description)}</p>
          <a href="${this.escapeHtml(promotion.link)}" target="_blank" rel="noopener noreferrer" class="promotion-popup-button">
            Ver más <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      </div>
    `;
    
    // Agregar al body
    document.body.appendChild(this.overlay);
    
    // Guardar el elemento que tenía el foco antes
    this.previousFocus = document.activeElement;
    
    // Event listeners
    const closeBtn = this.overlay.querySelector('.promotion-popup-close');
    closeBtn.addEventListener('click', () => this.close());
    
    // Cerrar al hacer click fuera del popup
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
    
    // Cerrar con tecla ESC
    this.escapeHandler = (e) => {
      if (e.key === 'Escape' && this.overlay) {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
    
    // Trap focus dentro del popup
    this.trapFocus();
    
    // Enfocar el botón de cerrar
    setTimeout(() => {
      closeBtn.focus();
    }, 100);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  trapFocus() {
    const popup = this.overlay.querySelector('.promotion-popup');
    const focusableElements = popup.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    popup.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
    });
  }

  close() {
    if (!this.overlay) return;
    
    this.overlay.classList.add('closing');
    this.overlay.classList.remove('active');
    
    // Remover el event listener de escape
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }
    
    // Restaurar el foco al elemento anterior
    if (this.previousFocus) {
      this.previousFocus.focus();
    }
    
    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.overlay = null;
    }, 300);
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.promotionPopup = new PromotionPopup();
    window.promotionPopup.init();
  });
} else {
  window.promotionPopup = new PromotionPopup();
  window.promotionPopup.init();
}
