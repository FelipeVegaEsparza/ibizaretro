/**
 * Share Button & Modal
 * Se autoinyecta si encuentra <div id="share-button-container"></div> en el DOM
 * Si no hay contenedor, intenta colocarse junto al botón de notificaciones
 * Si tampoco lo encuentra, lo agrega al final del header
 */
(function() {
  'use strict';

  const SHARE_BTN_ID = 'share-btn-header';
  const MODAL_ID = 'share-modal-overlay';

  function getProjectName() {
    if (window.clientConfig && window.clientConfig.project_name) {
      return window.clientConfig.project_name;
    }
    const title = document.title.replace(' - Radio', '').replace('Radio -', '').trim();
    return title || 'Nuestra Radio';
  }

  function buildShareText() {
    return `Escuchá ${getProjectName()} en vivo`;
  }

  function buildModal() {
    if (document.getElementById(MODAL_ID)) return;

    const url = window.location.href;
    const text = buildShareText();
    const encUrl = encodeURIComponent(url);
    const encText = encodeURIComponent(text);

    const overlay = document.createElement('div');
    overlay.className = 'share-modal-overlay';
    overlay.id = MODAL_ID;
    overlay.innerHTML = `
      <div class="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
        <div class="share-modal-header">
          <h3 id="share-modal-title"><i class="fas fa-share-alt"></i> Compartir</h3>
          <button class="share-modal-close" id="share-modal-close" aria-label="Cerrar">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="share-modal-body">
          <p class="share-modal-subtitle">Compartí ${getProjectName()} con tus amigos</p>

          <div class="share-url-box">
            <input type="text" id="share-url-input" value="${url}" readonly aria-label="Enlace para compartir">
            <button class="share-url-copy" id="share-url-copy" type="button">
              <i class="fas fa-copy"></i> Copiar
            </button>
          </div>

          <div class="share-social-grid">
            <a class="share-social-btn whatsapp" href="https://api.whatsapp.com/send?text=${encText}%20${encUrl}" target="_blank" rel="noopener">
              <i class="fab fa-whatsapp"></i> WhatsApp
            </a>
            <a class="share-social-btn facebook" href="https://www.facebook.com/sharer/sharer.php?u=${encUrl}" target="_blank" rel="noopener">
              <i class="fab fa-facebook-f"></i> Facebook
            </a>
            <a class="share-social-btn twitter" href="https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}" target="_blank" rel="noopener">
              <i class="fab fa-x-twitter"></i> X / Twitter
            </a>
            <a class="share-social-btn telegram" href="https://t.me/share/url?url=${encUrl}&text=${encText}" target="_blank" rel="noopener">
              <i class="fab fa-telegram-plane"></i> Telegram
            </a>
            <a class="share-social-btn email" href="mailto:?subject=${encText}&body=${encText}%20${encUrl}">
              <i class="fas fa-envelope"></i> Email
            </a>
            <button class="share-social-btn native" id="share-native-btn" type="button" style="display:none;">
              <i class="fas fa-share-alt"></i> Compartir
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    if (navigator.share) {
      const nativeBtn = document.getElementById('share-native-btn');
      if (nativeBtn) nativeBtn.style.display = 'flex';
    }

    document.getElementById('share-modal-close').addEventListener('click', closeShareModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeShareModal();
    });

    const copyBtn = document.getElementById('share-url-copy');
    copyBtn.addEventListener('click', () => {
      const input = document.getElementById('share-url-input');
      input.select();
      input.setSelectionRange(0, 99999);
      const copyText = () => {
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copiado';
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copiar';
        }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(input.value).then(copyText).catch(() => {
          document.execCommand('copy');
          copyText();
        });
      } else {
        document.execCommand('copy');
        copyText();
      }
    });

    const nativeBtn = document.getElementById('share-native-btn');
    if (nativeBtn && navigator.share) {
      nativeBtn.addEventListener('click', async () => {
        try {
          await navigator.share({
            title: getProjectName(),
            text: text,
            url: url
          });
          closeShareModal();
        } catch (err) {
          if (err.name !== 'AbortError') console.warn('Share failed:', err);
        }
      });
    }
  }

  function openShareModal() {
    const overlay = document.getElementById(MODAL_ID);
    if (overlay) overlay.classList.add('active');
  }

  function closeShareModal() {
    const overlay = document.getElementById(MODAL_ID);
    if (overlay) overlay.classList.remove('active');
  }

  function createButton() {
    if (document.getElementById(SHARE_BTN_ID)) return null;

    const btn = document.createElement('button');
    btn.className = 'share-btn-header';
    btn.id = SHARE_BTN_ID;
    btn.type = 'button';
    btn.title = 'Compartir';
    btn.setAttribute('aria-label', 'Compartir');
    btn.innerHTML = '<i class="fas fa-share-alt"></i><span>Compartir</span>';
    btn.addEventListener('click', openShareModal);
    return btn;
  }

  function findInnerContainer(outerContainer) {
    if (!outerContainer) return null;
    const inner = outerContainer.querySelector('.social-link');
    if (inner) return inner.parentElement;
    return outerContainer;
  }

  function injectButton() {
    if (document.getElementById(SHARE_BTN_ID)) return;

    const explicitContainer = document.getElementById('share-button-container');
    if (explicitContainer) {
      explicitContainer.appendChild(createButton());
      return;
    }

    const socialTargets = [
      'header-social-main',
      'social-links',
      'header-social',
      'sidebar-social'
    ];

    for (const sel of socialTargets) {
      const outerContainer = document.getElementById(sel);
      if (!outerContainer) continue;

      const btn = createButton();
      if (!btn) return;

      const placeButton = () => {
        const innerContainer = findInnerContainer(outerContainer);
        if (innerContainer && !innerContainer.contains(btn)) {
          innerContainer.appendChild(btn);
        }
      };

      placeButton();

      const observer = new MutationObserver(placeButton);
      observer.observe(outerContainer, { childList: true, subtree: true });
      return;
    }

    const fallbackTargets = [
      'header-actions',
      'topbar-actions',
      'social-section',
      'header-inner',
      'topbar-inner',
      'player-header',
      'dynamic-header',
      'masthead',
      'topbar',
      'header'
    ];
    for (const sel of fallbackTargets) {
      const target = document.querySelector(sel);
      if (target) {
        const btn = createButton();
        if (btn) target.appendChild(btn);
        return;
      }
    }
  }

  function init() {
    injectButton();
    buildModal();
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeShareModal();
    });
  }

  window.openShareModal = openShareModal;
  window.closeShareModal = closeShareModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
