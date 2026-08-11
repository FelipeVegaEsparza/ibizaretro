# 🔧 Troubleshooting TV Popup - Template Minimalista

## 🚨 **Problema Reportado**
El botón "TV Online" aparece correctamente pero no se abre el modal con el reproductor de video.

## 🔍 **Pasos de Diagnóstico**

### **1. Verificar en la Consola del Navegador**

Abre las herramientas de desarrollador (F12) y ejecuta estos comandos:

```javascript
// 1. Verificar elementos del DOM
console.log('TV Button:', document.getElementById('tv-online-btn'));
console.log('Popup Overlay:', document.getElementById('tv-popup-overlay'));

// 2. Verificar instancia del player
console.log('Player instance:', window.radioPulsePlayer);

// 3. Verificar URL de video
if (window.radioPulsePlayer) {
  console.log('Video URL:', window.radioPulsePlayer.videoStreamUrl);
}
```

### **2. Probar Apertura Manual del Popup**

```javascript
// Función manual para abrir popup
function openTVPopupManual() {
  const overlay = document.getElementById('tv-popup-overlay');
  if (overlay) {
    overlay.classList.add('active');
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
    document.body.style.overflow = 'hidden';
    console.log('Popup abierto manualmente');
  }
}

// Ejecutar
openTVPopupManual();
```

### **3. Verificar Event Listeners**

```javascript
// Agregar listener manual al botón
const tvButton = document.getElementById('tv-online-btn');
if (tvButton) {
  tvButton.addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Botón TV clickeado');
    openTVPopupManual();
  });
  console.log('Event listener agregado');
}
```

### **4. Probar Función de Debug**

```javascript
// Si la instancia del player existe
if (window.radioPulsePlayer) {
  window.radioPulsePlayer.showDebugPopup();
}
```

## 🛠️ **Posibles Soluciones**

### **Solución 1: Verificar Carga de Scripts**
Asegúrate de que el script se esté cargando correctamente:

```html
<!-- Verificar que estos scripts estén en el HTML -->
<script type="module" src="/assets/js/video-player.js"></script>
<script type="module" src="assets/js/main.js"></script>
```

### **Solución 2: Forzar Estilos del Popup**
Si el popup no se muestra, agregar estilos forzados:

```css
.tv-popup-overlay.active {
  display: flex !important;
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
}
```

### **Solución 3: Simplificar el Popup**
Reemplazar el popup complejo con uno simple:

```javascript
// Función simplificada
function openSimplePopup() {
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.9);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  popup.innerHTML = `
    <div style="background: #1a1a2e; padding: 20px; border-radius: 10px; max-width: 800px; width: 90%;">
      <h3 style="color: white; margin: 0 0 20px 0;">TV Online</h3>
      <div id="simple-tv-container" style="min-height: 400px; background: #000; border-radius: 5px;"></div>
      <button onclick="this.closest('.popup').remove()" style="margin-top: 15px; padding: 10px 20px; background: #ff6b6b; color: white; border: none; border-radius: 5px; cursor: pointer;">Cerrar</button>
    </div>
  `;
  
  popup.className = 'popup';
  document.body.appendChild(popup);
}
```

## 📋 **Checklist de Verificación**

- [ ] ✅ El botón "TV Online" es visible
- [ ] ❓ El botón responde al click (verificar en consola)
- [ ] ❓ El elemento popup existe en el DOM
- [ ] ❓ Los estilos CSS se están aplicando
- [ ] ❓ La instancia del player existe
- [ ] ❓ Hay URL de video disponible
- [ ] ❓ Los event listeners están configurados

## 🔧 **Script de Debug Completo**

Copia y pega este script en la consola del navegador:

```javascript
// === SCRIPT DE DEBUG TV POPUP ===
console.log('=== INICIANDO DEBUG TV POPUP ===');

// Verificar elementos
const tvBtn = document.getElementById('tv-online-btn');
const popup = document.getElementById('tv-popup-overlay');
const player = window.radioPulsePlayer;

console.log('Botón TV:', !!tvBtn);
console.log('Popup:', !!popup);
console.log('Player:', !!player);

if (tvBtn) {
  console.log('Botón visible:', window.getComputedStyle(tvBtn).display !== 'none');
}

if (popup) {
  console.log('Popup clases:', popup.classList.toString());
  console.log('Popup estilos:', {
    display: window.getComputedStyle(popup).display,
    opacity: window.getComputedStyle(popup).opacity,
    visibility: window.getComputedStyle(popup).visibility
  });
}

// Función de prueba
window.testTVPopup = function() {
  if (popup) {
    popup.classList.add('active');
    popup.style.display = 'flex';
    popup.style.opacity = '1';
    popup.style.visibility = 'visible';
    console.log('Popup activado manualmente');
  }
};

console.log('Ejecuta testTVPopup() para probar');
console.log('=== FIN DEBUG ===');
```

## 📞 **Próximos Pasos**

1. **Ejecutar el script de debug** y reportar los resultados
2. **Verificar la consola** por errores de JavaScript
3. **Probar la función manual** de apertura
4. **Revisar los estilos CSS** en las herramientas de desarrollador

Una vez que identifiquemos el problema específico, podremos aplicar la solución correcta.