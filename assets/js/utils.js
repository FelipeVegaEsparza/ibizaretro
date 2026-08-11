/**
 * Security Utilities
 * Funciones de utilidad para sanitización y seguridad
 */

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado seguro para HTML
 */
export function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  
  const str = String(text);
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Escapa atributos HTML (más restrictivo que escapeHtml)
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado seguro para atributos
 */
export function escapeAttribute(text) {
  if (text === null || text === undefined) return '';
  
  const str = String(text);
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Sanitiza una URL para prevenir javascript: y data: URLs maliciosas
 * @param {string} url - URL a sanitizar
 * @returns {string} - URL segura o cadena vacía
 */
export function sanitizeUrl(url) {
  if (!url) return '';
  
  const str = String(url).trim().toLowerCase();
  
  // Bloquear protocolos peligrosos
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(protocol => str.startsWith(protocol))) {
    console.warn('Security: Blocked dangerous URL protocol:', url);
    return '';
  }
  
  return url;
}

/**
 * Crea elementos HTML de forma segura en lugar de innerHTML
 * @param {string} tag - Nombre del tag HTML
 * @param {Object} attributes - Atributos del elemento
 * @param {string|Node} content - Contenido (texto o nodo)
 * @returns {HTMLElement} - Elemento creado
 */
export function createSafeElement(tag, attributes = {}, content = '') {
  const element = document.createElement(tag);
  
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'href' || key === 'src') {
      const safeUrl = sanitizeUrl(value);
      if (safeUrl) {
        element.setAttribute(key, safeUrl);
      }
    } else if (key.startsWith('on')) {
      // No permitir atributos de evento inline
      console.warn('Security: Blocked inline event handler:', key);
    } else {
      element.setAttribute(key, escapeAttribute(value));
    }
  }
  
  if (typeof content === 'string') {
    element.textContent = content;
  } else if (content instanceof Node) {
    element.appendChild(content);
  }
  
  return element;
}

/**
 * Valida que un nombre de template sea seguro
 * @param {string} name - Nombre a validar
 * @returns {boolean} - true si es válido
 */
export function isValidTemplateName(name) {
  if (!name || typeof name !== 'string') return false;
  return /^[a-zA-Z0-9_-]+$/.test(name) && !name.includes('..');
}

/**
 * Logger seguro que solo funciona en desarrollo
 */
export const secureLog = {
  log: (...args) => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('[DEV]', ...args);
    }
  },
  warn: (...args) => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.warn('[DEV]', ...args);
    }
  },
  error: (...args) => {
    // Los errores siempre se loguean pero sin datos sensibles
    console.error('[APP]', ...args);
  }
};
