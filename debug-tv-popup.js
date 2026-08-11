// Script de debug para el popup de TV Online
// Ejecutar en la consola del navegador

console.log('=== DEBUG TV POPUP ===');

// 1. Verificar elementos del DOM
const tvButton = document.getElementById('tv-online-btn');
const popupOverlay = document.getElementById('tv-popup-overlay');
const closeButton = document.getElementById('tv-popup-close');

console.log('TV Button found:', !!tvButton);
console.log('Popup Overlay found:', !!popupOverlay);
console.log('Close Button found:', !!closeButton);

if (tvButton) {
  console.log('TV Button display:', window.getComputedStyle(tvButton).display);
  console.log('TV Button visibility:', window.getComputedStyle(tvButton).visibility);
  console.log('TV Button innerHTML:', tvButton.innerHTML);
}

if (popupOverlay) {
  console.log('Popup classes:', popupOverlay.classList.toString());
  console.log('Popup display:', window.getComputedStyle(popupOverlay).display);
  console.log('Popup visibility:', window.getComputedStyle(popupOverlay).visibility);
  console.log('Popup opacity:', window.getComputedStyle(popupOverlay).opacity);
}

// 2. Verificar instancia del player
if (window.radioPulsePlayer) {
  console.log('RadioPulsePlayer instance found');
  console.log('Video stream URL:', window.radioPulsePlayer.videoStreamUrl);
  
  // Test function
  window.testTVPopup = function() {
    console.log('Testing TV popup manually...');
    window.radioPulsePlayer.openTVPopup();
  };
  
  console.log('Run testTVPopup() to test the popup manually');
} else {
  console.log('RadioPulsePlayer instance not found');
}

// 3. Función manual para abrir popup
window.openTVPopupManual = function() {
  console.log('Opening TV popup manually...');
  const overlay = document.getElementById('tv-popup-overlay');
  if (overlay) {
    overlay.classList.add('active');
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
    document.body.style.overflow = 'hidden';
    console.log('Popup should be visible now');
  } else {
    console.error('Popup overlay not found');
  }
};

// 4. Función manual para cerrar popup
window.closeTVPopupManual = function() {
  console.log('Closing TV popup manually...');
  const overlay = document.getElementById('tv-popup-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    console.log('Popup should be hidden now');
  }
};

console.log('=== DEBUG FUNCTIONS AVAILABLE ===');
console.log('- openTVPopupManual() - Open popup manually');
console.log('- closeTVPopupManual() - Close popup manually');
console.log('- testTVPopup() - Test via player instance (if available)');

// 5. Agregar event listener manual al botón
if (tvButton) {
  tvButton.addEventListener('click', function(e) {
    e.preventDefault();
    console.log('TV button clicked - manual listener');
    openTVPopupManual();
  });
  console.log('Manual event listener added to TV button');
}