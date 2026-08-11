# OneSignal - Guía para Desarrolladores

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
assets/
├── css/
│   └── notification-button.css          # Estilos del botón
└── js/
    ├── onesignal-manager.js             # Lógica de OneSignal (Singleton)
    ├── notification-button.js           # Componente UI del botón
    └── onesignal-init.js               # Inicialización automática

public/
└── OneSignalSDKWorker.js               # Service Worker de OneSignal
```

### Flujo de Inicialización

```
1. onesignal-init.js se carga
   ↓
2. Llama a oneSignalManager.init()
   ↓
3. oneSignalManager hace fetch a /api/public/[clientId]
   ↓
4. Si oneSignalAppId existe:
   ├─ Carga el SDK de OneSignal
   ├─ Inicializa OneSignal con el App ID
   └─ Dispara evento 'onesignal-ready'
   ↓
5. NotificationButton verifica estado de suscripción
   ↓
6. Renderiza el botón apropiado
```

## 📦 Módulos

### 1. OneSignalManager (Singleton)

**Archivo:** `assets/js/onesignal-manager.js`

**Responsabilidades:**
- Obtener `oneSignalAppId` de la API
- Cargar el SDK de OneSignal dinámicamente
- Inicializar OneSignal
- Proveer API para interactuar con OneSignal
- Manejar eventos de OneSignal

**API Pública:**

```javascript
import { oneSignalManager } from '/assets/js/onesignal-manager.js';

// Inicializar (llamado automáticamente por onesignal-init.js)
await oneSignalManager.init();

// Verificar si está inicializado
oneSignalManager.initialized // boolean

// Verificar si el usuario está suscrito
const isSubscribed = await oneSignalManager.isSubscribed();

// Solicitar permisos
const granted = await oneSignalManager.requestPermission();

// Obtener ID del usuario
const userId = await oneSignalManager.getUserId();

// Enviar tags
await oneSignalManager.sendTags({ 'categoria': 'noticias' });

// Obtener estado de permisos
const state = await oneSignalManager.getPermissionState();
// 'default' | 'granted' | 'denied' | 'unsupported' | 'not-initialized'
```

**Eventos Personalizados:**

```javascript
// Escuchar cambios en suscripción
window.addEventListener('onesignal-subscription-changed', (event) => {
  console.log('Suscrito:', event.detail.isSubscribed);
});
```

### 2. NotificationButton (Componente)

**Archivo:** `assets/js/notification-button.js`

**Responsabilidades:**
- Renderizar el botón de notificaciones
- Manejar clics del usuario
- Actualizar UI según estado de suscripción
- Mostrar estados de loading

**API Pública:**

```javascript
import { NotificationButton, initNotificationButton } from '/assets/js/notification-button.js';

// Forma 1: Función helper (recomendada)
const button = initNotificationButton('mi-contenedor-id');

// Forma 2: Instancia directa
const button = new NotificationButton('mi-contenedor-id');

// Destruir el botón
button.destroy();
```

**Estados del Botón:**

1. **Loading:** Verificando estado inicial
2. **Not Subscribed:** Botón para activar notificaciones
3. **Subscribed:** Badge indicando que está activado
4. **Not Supported:** No se muestra (navegador no compatible)

### 3. OneSignalInit (Auto-inicialización)

**Archivo:** `assets/js/onesignal-init.js`

**Responsabilidades:**
- Inicializar OneSignal automáticamente al cargar la página
- Crear el botón si existe el contenedor
- Manejar errores de inicialización

**Uso:**

```html
<!-- Simplemente incluir el script -->
<script type="module" src="/assets/js/onesignal-init.js"></script>

<!-- Y agregar el contenedor -->
<div id="notification-button-container"></div>
```

## 🔧 Integración Avanzada

### Uso Manual (Sin Auto-inicialización)

Si no quieres usar `onesignal-init.js`, puedes controlar todo manualmente:

```javascript
import { oneSignalManager } from '/assets/js/onesignal-manager.js';
import { NotificationButton } from '/assets/js/notification-button.js';

// Inicializar OneSignal
const initialized = await oneSignalManager.init();

if (initialized) {
  // Crear botón personalizado
  const button = new NotificationButton('mi-contenedor');
  
  // O hacer algo personalizado
  const isSubscribed = await oneSignalManager.isSubscribed();
  
  if (!isSubscribed) {
    // Mostrar tu propio UI
    document.getElementById('mi-boton').addEventListener('click', async () => {
      await oneSignalManager.requestPermission();
    });
  }
}
```

### Crear Botón Personalizado

```javascript
import { oneSignalManager } from '/assets/js/onesignal-manager.js';

class MiBotonPersonalizado {
  constructor() {
    this.init();
  }
  
  async init() {
    // Esperar a que OneSignal esté listo
    while (!oneSignalManager.initialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Verificar estado
    const isSubscribed = await oneSignalManager.isSubscribed();
    
    // Renderizar tu UI
    this.render(isSubscribed);
    
    // Escuchar cambios
    window.addEventListener('onesignal-subscription-changed', (event) => {
      this.render(event.detail.isSubscribed);
    });
  }
  
  render(isSubscribed) {
    // Tu lógica de renderizado
  }
  
  async handleClick() {
    await oneSignalManager.requestPermission();
  }
}
```

### Segmentación con Tags

```javascript
import { oneSignalManager } from '/assets/js/onesignal-manager.js';

// Después de que el usuario se suscriba
window.addEventListener('onesignal-subscription-changed', async (event) => {
  if (event.detail.isSubscribed) {
    // Enviar tags para segmentación
    await oneSignalManager.sendTags({
      'idioma': 'es',
      'categoria_favorita': 'rock',
      'notificaciones_noticias': 'true',
      'notificaciones_eventos': 'true',
      'notificaciones_promociones': 'false'
    });
  }
});
```

### Obtener User ID para Backend

```javascript
import { oneSignalManager } from '/assets/js/onesignal-manager.js';

// Obtener el User ID de OneSignal
const userId = await oneSignalManager.getUserId();

// Enviar a tu backend
await fetch('/api/save-onesignal-id', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ oneSignalUserId: userId })
});
```

## 🎨 Personalización Avanzada

### Estilos Personalizados

```css
/* Sobrescribir estilos del botón */
.notification-btn {
  /* Tu gradiente personalizado */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  /* Sombra personalizada */
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  
  /* Animación personalizada */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-btn:hover {
  transform: translateY(-3px) scale(1.05);
}

/* Tema oscuro personalizado */
@media (prefers-color-scheme: dark) {
  .notification-btn {
    background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  }
}
```

### Botón Flotante

```css
#notification-button-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}

.notification-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  padding: 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.notification-btn .notification-text {
  display: none;
}
```

### Animaciones Personalizadas

```css
@keyframes bounce-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.notification-btn {
  animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

## 🧪 Testing

### Test Manual en Consola

```javascript
// Verificar inicialización
console.log('Inicializado:', oneSignalManager.initialized);

// Verificar suscripción
await oneSignalManager.isSubscribed();

// Verificar permisos
await oneSignalManager.getPermissionState();

// Obtener User ID
await oneSignalManager.getUserId();

// Forzar solicitud de permisos
await oneSignalManager.requestPermission();
```

### Test de Integración

```javascript
// Test completo
async function testOneSignal() {
  console.log('=== Test OneSignal ===');
  
  // 1. Verificar inicialización
  console.log('1. Inicializado:', oneSignalManager.initialized);
  
  if (!oneSignalManager.initialized) {
    console.error('❌ OneSignal no inicializado');
    return;
  }
  
  // 2. Verificar soporte
  console.log('2. Soportado:', oneSignalManager.isSupported);
  
  // 3. Verificar estado de permisos
  const permission = await oneSignalManager.getPermissionState();
  console.log('3. Permisos:', permission);
  
  // 4. Verificar suscripción
  const isSubscribed = await oneSignalManager.isSubscribed();
  console.log('4. Suscrito:', isSubscribed);
  
  // 5. Obtener User ID
  const userId = await oneSignalManager.getUserId();
  console.log('5. User ID:', userId);
  
  console.log('=== Test Completado ===');
}

// Ejecutar test
testOneSignal();
```

## 🔒 Seguridad

### Validaciones Implementadas

1. **Verificación de HTTPS:** Solo funciona en HTTPS (excepto localhost)
2. **Verificación de Soporte:** Solo se inicializa si el navegador soporta notificaciones
3. **Verificación de App ID:** Solo se inicializa si el cliente tiene `oneSignalAppId`
4. **Permisos Explícitos:** El usuario debe aceptar permisos manualmente

### Mejores Prácticas

```javascript
// ✅ BIEN: Verificar antes de usar
if (oneSignalManager.initialized) {
  await oneSignalManager.isSubscribed();
}

// ❌ MAL: Asumir que está inicializado
await oneSignalManager.isSubscribed(); // Puede fallar
```

## 📊 Monitoreo y Analytics

### Eventos a Trackear

```javascript
// Trackear inicialización
window.addEventListener('onesignal-ready', () => {
  analytics.track('OneSignal Initialized');
});

// Trackear suscripciones
window.addEventListener('onesignal-subscription-changed', (event) => {
  if (event.detail.isSubscribed) {
    analytics.track('User Subscribed to Push');
  } else {
    analytics.track('User Unsubscribed from Push');
  }
});

// Trackear clics en notificaciones
window.OneSignal.push(() => {
  window.OneSignal.on('notificationClick', (event) => {
    analytics.track('Notification Clicked', {
      title: event.data.title,
      url: event.data.url
    });
  });
});
```

## 🚀 Optimizaciones

### Lazy Loading

El SDK de OneSignal se carga dinámicamente solo cuando es necesario:

```javascript
// En onesignal-manager.js
loadOneSignalSDK() {
  return new Promise((resolve, reject) => {
    if (window.OneSignal) {
      resolve(); // Ya está cargado
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
```

### Caché de Estado

El estado de suscripción se cachea para evitar llamadas repetidas:

```javascript
// Implementación futura
class OneSignalManager {
  constructor() {
    this._subscriptionCache = null;
    this._cacheExpiry = null;
  }
  
  async isSubscribed() {
    // Usar caché si es válido
    if (this._subscriptionCache !== null && Date.now() < this._cacheExpiry) {
      return this._subscriptionCache;
    }
    
    // Obtener estado real
    const isSubscribed = await this._checkSubscription();
    
    // Cachear por 5 segundos
    this._subscriptionCache = isSubscribed;
    this._cacheExpiry = Date.now() + 5000;
    
    return isSubscribed;
  }
}
```

## 🐛 Debugging

### Habilitar Logs Detallados

```javascript
// En onesignal-manager.js, agregar:
window.OneSignal.push(() => {
  window.OneSignal.log.setLevel('trace'); // 'trace', 'debug', 'info', 'warn', 'error'
});
```

### Verificar Service Worker

```javascript
// En consola
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
  registrations.forEach(reg => {
    console.log('Scope:', reg.scope);
    console.log('Active:', reg.active);
  });
});
```

### Verificar Permisos

```javascript
// En consola
Notification.permission // 'default', 'granted', 'denied'
```

## 📚 Recursos Adicionales

- [OneSignal Web SDK Reference](https://documentation.onesignal.com/docs/web-push-sdk)
- [Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

## 🤝 Contribuir

Si encuentras bugs o tienes mejoras:

1. Documenta el problema
2. Propón una solución
3. Prueba en múltiples navegadores
4. Actualiza la documentación

---

**Última actualización:** 2026-01-25
