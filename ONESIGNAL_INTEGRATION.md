# Integración de OneSignal - Notificaciones Push

## 📋 Resumen

Este proyecto ahora incluye soporte completo para notificaciones push usando OneSignal. El sistema se inicializa automáticamente si el cliente tiene configurado un `oneSignalAppId` en el panel de administración.

## 🚀 Implementación Rápida

### Opción 1: Implementación Automática (Recomendada)

Agrega estos dos elementos en el HTML de tu template:

```html
<!-- En el <head> -->
<link rel="stylesheet" href="/assets/css/notification-button.css">

<!-- Antes del cierre de </body> -->
<script type="module" src="/assets/js/onesignal-init.js"></script>

<!-- Donde quieras que aparezca el botón (header, sidebar, etc.) -->
<div id="notification-button-container"></div>
```

¡Eso es todo! El sistema se encargará de:
- ✅ Verificar si el cliente tiene OneSignal configurado
- ✅ Inicializar OneSignal automáticamente
- ✅ Mostrar el botón solo si está soportado
- ✅ Manejar el estado de suscripción
- ✅ Actualizar la UI automáticamente

### Opción 2: Implementación Manual

Si necesitas más control, puedes usar los módulos directamente:

```javascript
import { oneSignalManager } from '/assets/js/onesignal-manager.js';
import { initNotificationButton } from '/assets/js/notification-button.js';

// Inicializar OneSignal
const initialized = await oneSignalManager.init();

if (initialized) {
  // Crear el botón
  initNotificationButton('tu-contenedor-id');
  
  // O verificar estado manualmente
  const isSubscribed = await oneSignalManager.isSubscribed();
  console.log('Usuario suscrito:', isSubscribed);
}
```

## 📁 Archivos Creados

```
assets/
├── css/
│   └── notification-button.css      # Estilos del botón
└── js/
    ├── onesignal-manager.js         # Lógica de OneSignal
    ├── notification-button.js       # Componente del botón
    └── onesignal-init.js           # Inicialización automática

public/
└── OneSignalSDKWorker.js           # Service Worker de OneSignal
```

## 🎨 Personalización del Botón

### Cambiar Estilos

Edita `assets/css/notification-button.css` para personalizar:

```css
.notification-btn {
  /* Cambia el gradiente */
  background: linear-gradient(135deg, #tu-color-1 0%, #tu-color-2 100%);
  
  /* Cambia el tamaño */
  padding: 12px 20px;
  font-size: 16px;
  
  /* Cambia el border-radius */
  border-radius: 12px;
}
```

### Cambiar Textos

Edita `assets/js/notification-button.js` líneas 115-120 y 130-135:

```javascript
// Texto cuando está suscrito
<span class="notification-text">Tu texto aquí</span>

// Texto cuando no está suscrito
<span class="notification-text">Tu texto aquí</span>
```

### Cambiar Iconos

Reemplaza el SVG en `assets/js/notification-button.js` con tu propio icono.

## 🔧 API del OneSignalManager

### Métodos Disponibles

```javascript
// Verificar si está inicializado
oneSignalManager.initialized // boolean

// Verificar si el usuario está suscrito
await oneSignalManager.isSubscribed() // Promise<boolean>

// Solicitar permisos
await oneSignalManager.requestPermission() // Promise<boolean>

// Obtener ID del usuario
await oneSignalManager.getUserId() // Promise<string|null>

// Enviar tags personalizados
await oneSignalManager.sendTags({
  'categoria': 'noticias',
  'idioma': 'es'
}) // Promise<boolean>

// Obtener estado de permisos
await oneSignalManager.getPermissionState() 
// 'default' | 'granted' | 'denied' | 'unsupported' | 'not-initialized'
```

### Eventos Personalizados

Escucha cambios en el estado de suscripción:

```javascript
window.addEventListener('onesignal-subscription-changed', (event) => {
  console.log('Suscrito:', event.detail.isSubscribed);
});
```

## 📱 Soporte por Plataforma

| Plataforma | Soporte | Notas |
|------------|---------|-------|
| Chrome (Android) | ✅ | Funciona incluso con PWA cerrada |
| Chrome (Desktop) | ✅ | Windows, Mac, Linux |
| Firefox (Android) | ✅ | Requiere PWA instalada |
| Firefox (Desktop) | ✅ | Windows, Mac, Linux |
| Edge (Desktop) | ✅ | Windows, Mac |
| Safari (iOS) | ❌ | Apple no permite push en PWA |
| Safari (macOS) | ⚠️ | Requiere configuración adicional |

## 🧪 Testing

### 1. Desarrollo Local

El sistema permite `localhost` automáticamente para desarrollo.

### 2. Verificar Inicialización

Abre la consola del navegador y busca:
```
OneSignal: Iniciando...
OneSignal: Inicializado correctamente
```

### 3. Verificar Suscripción

```javascript
// En la consola del navegador
await oneSignalManager.isSubscribed()
```

### 4. Enviar Notificación de Prueba

Desde el panel de administración:
1. Ve a `/dashboard/notifications`
2. Crea una notificación de prueba
3. Envíala inmediatamente
4. Verifica que llegue al navegador

## 🐛 Troubleshooting

### El botón no aparece

**Posibles causas:**
- El cliente no tiene `oneSignalAppId` configurado
- El navegador no soporta notificaciones
- El contenedor `notification-button-container` no existe

**Solución:**
```javascript
// Verificar en consola
console.log('Soportado:', 'Notification' in window);
console.log('Inicializado:', oneSignalManager.initialized);
```

### Las notificaciones no llegan

**Posibles causas:**
- El usuario no aceptó los permisos
- El sitio no está en HTTPS (en producción)
- El App ID es incorrecto

**Solución:**
```javascript
// Verificar permisos
await oneSignalManager.getPermissionState()
// Debe retornar 'granted'
```

### Error: "Service Worker registration failed"

**Causa:** El archivo `OneSignalSDKWorker.js` no es accesible

**Solución:**
- Verifica que existe en `/public/OneSignalSDKWorker.js`
- Verifica que sea accesible en `https://tu-dominio.com/OneSignalSDKWorker.js`

### iOS no funciona

**Causa:** iOS Safari no soporta push notifications en PWA

**Solución:** Informa a los usuarios de iOS que usen Android/Desktop o considera crear una app nativa.

## 📊 Ejemplo de Integración en Template

### Template Minimalista

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Mi Radio</title>
  
  <!-- OneSignal CSS -->
  <link rel="stylesheet" href="/assets/css/notification-button.css">
  
  <!-- Otros estilos -->
  <link rel="stylesheet" href="/templates/minimalista/assets/css/style.css">
</head>
<body>
  <header>
    <div class="logo">Mi Radio</div>
    
    <!-- Botón de notificaciones -->
    <div id="notification-button-container"></div>
  </header>
  
  <main>
    <!-- Contenido -->
  </main>
  
  <!-- OneSignal Init (antes de otros scripts) -->
  <script type="module" src="/assets/js/onesignal-init.js"></script>
  
  <!-- Otros scripts -->
  <script type="module" src="/templates/minimalista/assets/js/main.js"></script>
</body>
</html>
```

## 🔐 Seguridad

- ✅ Solo se inicializa si el cliente tiene OneSignal configurado
- ✅ Requiere HTTPS en producción
- ✅ El usuario debe aceptar permisos explícitamente
- ✅ No se envían datos sensibles a OneSignal
- ✅ El App ID se obtiene de forma segura desde la API

## 📈 Próximos Pasos

1. **Implementar en Templates**: Agrega el botón en todos los templates
2. **Personalizar Mensajes**: Adapta los textos a cada cliente
3. **Segmentación**: Usa tags para enviar notificaciones específicas
4. **Analytics**: Monitorea las tasas de apertura en el dashboard de OneSignal

## 🆘 Soporte

Si tienes problemas:

1. Verifica la consola del navegador
2. Verifica que la API devuelva `oneSignalAppId`
3. Verifica que el sitio esté en HTTPS
4. Revisa el dashboard de OneSignal
5. Consulta la documentación oficial: https://documentation.onesignal.com/

## 📝 Changelog

### v1.0.0 - 2026-01-25
- ✅ Implementación inicial del sistema
- ✅ Componente de botón responsive
- ✅ Manager de OneSignal
- ✅ Inicialización automática
- ✅ Soporte para todos los navegadores compatibles
- ✅ Documentación completa
