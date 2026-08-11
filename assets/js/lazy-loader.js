/**
 * Lazy Loading para imágenes
 * Carga imágenes solo cuando entran en el viewport
 */

class LazyLoader {
  constructor(options = {}) {
    this.selector = options.selector || 'img[data-src]';
    this.rootMargin = options.rootMargin || '50px';
    this.threshold = options.threshold || 0.01;
    this.observer = null;
    this.loadedImages = new Set();
  }

  init() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: cargar todas las imágenes inmediatamente
      this.loadAllImages();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        rootMargin: this.rootMargin,
        threshold: this.threshold
      }
    );

    this.observeImages();
    
    // Observar cambios en el DOM para nuevas imágenes
    this.setupMutationObserver();
  }

  observeImages() {
    const images = document.querySelectorAll(this.selector);
    images.forEach(img => {
      if (!this.loadedImages.has(img)) {
        this.observer.observe(img);
      }
    });
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
        this.observer.unobserve(entry.target);
      }
    });
  }

  loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;
    
    if (!src) return;

    // Marcar como cargando
    img.classList.add('lazy-loading');
    
    // Crear una imagen de precarga
    const preloadImg = new Image();
    
    preloadImg.onload = () => {
      img.src = src;
      if (srcset) img.srcset = srcset;
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');
      img.removeAttribute('data-src');
      img.removeAttribute('data-srcset');
      this.loadedImages.add(img);
    };
    
    preloadImg.onerror = () => {
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-error');
      // Opcional: mostrar imagen de fallback
      if (img.dataset.fallback) {
        img.src = img.dataset.fallback;
      }
    };
    
    preloadImg.src = src;
  }

  loadAllImages() {
    const images = document.querySelectorAll(this.selector);
    images.forEach(img => this.loadImage(img));
  }

  setupMutationObserver() {
    if (!('MutationObserver' in window)) return;
    
    const observer = new MutationObserver((mutations) => {
      let shouldObserve = false;
      
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches && node.matches(this.selector)) {
              shouldObserve = true;
            }
            if (node.querySelectorAll) {
              const images = node.querySelectorAll(this.selector);
              if (images.length > 0) shouldObserve = true;
            }
          }
        });
      });
      
      if (shouldObserve) {
        this.observeImages();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Cargar imágenes en un contenedor específico
  loadImagesInContainer(container) {
    const images = container.querySelectorAll(this.selector);
    images.forEach(img => this.loadImage(img));
  }
}

// Instancia global
let lazyLoaderInstance = null;

export function initLazyLoading(options = {}) {
  if (!lazyLoaderInstance) {
    lazyLoaderInstance = new LazyLoader(options);
    lazyLoaderInstance.init();
  }
  return lazyLoaderInstance;
}

export function getLazyLoader() {
  return lazyLoaderInstance;
}

// Auto-inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initLazyLoading());
} else {
  initLazyLoading();
}
