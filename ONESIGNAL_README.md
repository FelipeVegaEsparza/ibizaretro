# 🔔 Sistema de Notificaciones Push con OneSignal

## 📖 Descripción

Sistema completo de notificaciones push integrado con OneSignal para la PWA de radio. Permite a los clientes enviar notificaciones a sus usuarios desde el panel de administración.

## ✨ Características

- ✅ **Inicialización Automática**: Se configura solo si el cliente tiene OneSignal
- ✅ **Botón Responsive**: Se adapta a todos los dispositivos
- ✅ **Detección de Soporte**: Solo se muestra en navegadores compatibles
- ✅ **Manejo de Estados**: Actualización automática del UI
- ✅ **Fácil Integración**: Solo 3 líneas de código
- ✅ **Personalizable**: Estilos y comportamiento adaptables
- ✅ **Sin Dependencias**: Solo requiere OneSignal SDK
- ✅ **Documentación Completa**: Guías para todos los niveles

## 🚀 Inicio Rápido

### 1. Agregar CSS

```html
<link rel="stylesheet" href="/assets/css/notification-button.css">
```

### 2. Agregar Contenedor

```html
<div id="notification-button-container"></div>
```

### 3. Agregar Script

```html
<script type="module" src="/assets/js/onesignal-init.js"></script>
```

**¡Listo!** El sistema se encargará del resto.

## 📁 Estructura de Archivos

```
assets/
├── css/
│   └── notification-button.css          # Estilos del botón
└── js/
    ├── onesignal-manager.js             # Lógica de OneSignal
    ├── notification-button.js           # Componente del botón
    └── onesignal-init.js               # Inicialización automática

public/
└── OneSignalSDKWorker.js               # Service Worker de OneSignal

templates/
└── minimalista/
    └── index.html                       # Ejemplo de implementación

docs/
├── ONESIGNAL_INTEGRATION.md            # Documentación completa
├── ONESIGNAL_QUICK_START.md            # Guía rápida
├── ONESIGNAL_DEVELOPER_GUIDE.md        # Guía para desarrolladores
├── ONESIGNAL_EXAMPLES.md               # Ejemplos de uso
└── ONESIGNAL_README.md                 # Este archivo

test-onesignal.html                      # Página de prueba
```

## 📚 Documentación

### Para Usuarios

- **[Guía Rápida](ONESIGNAL_QUICK_START.md)** - Implementación en 3 pasos
- **[Documentación Completa](ONESIGNAL_INTEGRATION.md)** - Todo lo que necesitas saber
- **[Ejemplos](ONESIGNAL_EXAMPLES.md)** - Casos de uso comunes

### Para Desarrolladores

- **[Guía de Desarrollo](ONESIGNAL_DEVELOPER_GUIDE.md)** - Arquitectura y API
- **[Página de Prueba](test-onesignal.html)** - Testing y debugging

## 🎯 Casos de Uso

### 1. Botón en Header

```html
<header>
  <div class="logo">Mi Radio</div>
  <div id="notification-button-container"></div>
</header>
```

### 2. Botón Flotante

```html
<div id="notification-button-container" style="position: fixed; bottom: 20px; right: 20px;"></div>
```

### 3. Botón en Sidebar

```html
<aside class="sidebar">
  <nav>...</nav>
  <div id="notification-button-container"></div>
</aside>
```

## 🔧 API Básica

```javascript
import { oneSignalManager } from '/assets/js/onesignal-manager.js';

// Verificar si está inicializado
oneSignalManager.initialized // boolean

// Verificar suscripción
await oneSignalManager.isSubscribed() // Promise<boolean>

// Solicitar permisos
await oneSignalManager.requestPermission() // Promise<boolean>

// Obtener User ID
await oneSignalManager.getUserId() // Promise<string|null>

// Enviar tags
await oneSignalManager.sendTags({ 'categoria': 'noticias' })
```

## 🎨 Personalización

### Cambiar Colores

```css
.notification-btn {
  background: linear-gradient(135deg, #tu-color-1 0%, #tu-color-2 100%);
}
```

### Cambiar Tamaño

```css
.notification-btn {
  padding: 12px 20px;
  font-size: 16px;
}
```

### Cambiar Textos

Edita `assets/js/notification-button.js` líneas 115-135.

## 📱 Soporte

| Plataforma | Soporte |
|------------|---------|
| Chrome (Android) | ✅ |
| Chrome (Desktop) | ✅ |
| Firefox (Android) | ✅ |
| Firefox (Desktop) | ✅ |
| Edge (Desktop) | ✅ |
| Safari (iOS) | ❌ |
| Safari (macOS) | ⚠️ |

## 🧪 Testing

### Página de Prueba

Abre `test-onesignal.html` en tu navegador para:
- ✅ Verificar que OneSignal se inicializa
- ✅ Ver el estado del sistema
- ✅ Probar funcionalidades
- ✅ Ver logs en tiempo real

### Consola del Navegador

```javascript
// Verificar estado
console.log('Inicializado:', oneSignalManager.initialized);
await oneSignalManager.isSubscribed();
await oneSignalManager.getPermissionState();
```

## 🐛 Troubleshooting

### El botón no aparece

**Causa:** El cliente no tiene `oneSignalAppId` configurado

**Solución:** Esto es normal. El botón solo aparece si el cliente configuró OneSignal en el panel.

### Las notificaciones no llegan

**Causa:** El usuario no aceptó los permisos o el sitio no está en HTTPS

**Solución:** 
- Verifica que el usuario haya aceptado los permisos
- En producción, usa HTTPS (localhost funciona para desarrollo)

### Error en consola

**Causa:** Rutas incorrectas a los archivos

**Solución:** Verifica que las rutas sean correctas:
- `/assets/css/notification-button.css`
- `/assets/js/onesignal-init.js`
- `/public/OneSignalSDKWorker.js`

## 📊 Flujo del Sistema

```
1. Usuario visita la PWA
   ↓
2. onesignal-init.js se carga
   ↓
3. Hace fetch a /api/public/[clientId]
   ↓
4. Si oneSignalAppId existe:
   ├─ Carga SDK de OneSignal
   ├─ Inicializa OneSignal
   └─ Muestra el botón
   ↓
5. Usuario hace clic en el botón
   ↓
6. Se solicitan permisos
   ↓
7. Usuario acepta
   ↓
8. Usuario queda suscrito
   ↓
9. Cliente envía notificación desde el panel
   ↓
10. Usuario recibe la notificación
```

## 🔐 Seguridad

- ✅ Solo funciona en HTTPS (excepto localhost)
- ✅ Requiere permisos explícitos del usuario
- ✅ No se envían datos sensibles
- ✅ El App ID se obtiene de forma segura desde la API

## 📈 Próximos Pasos

1. **Implementar en Templates**: Agrega el botón en todos los templates
2. **Personalizar Estilos**: Adapta los colores a cada diseño
3. **Configurar Segmentación**: Usa tags para notificaciones específicas
4. **Monitorear Analytics**: Revisa las estadísticas en OneSignal

## 🤝 Contribuir

Si encuentras bugs o tienes mejoras:

1. Documenta el problema
2. Propón una solución
3. Prueba en múltiples navegadores
4. Actualiza la documentación

## 📝 Changelog

### v1.0.0 - 2026-01-25

- ✅ Implementación inicial del sistema
- ✅ Componente de botón responsive
- ✅ Manager de OneSignal
- ✅ Inicialización automática
- ✅ Soporte para todos los navegadores compatibles
- ✅ Documentación completa
- ✅ Página de prueba
- ✅ Ejemplos de uso
- ✅ Integración en template minimalista

## 📞 Soporte

Para más información:

- **Documentación Completa**: `ONESIGNAL_INTEGRATION.md`
- **Guía Rápida**: `ONESIGNAL_QUICK_START.md`
- **Guía de Desarrollo**: `ONESIGNAL_DEVELOPER_GUIDE.md`
- **Ejemplos**: `ONESIGNAL_EXAMPLES.md`
- **OneSignal Docs**: https://documentation.onesignal.com/

## 📄 Licencia

MIT - Mismo que el proyecto principal

---

**Desarrollado con ❤️ para IPStream Radio PWA**

**Última actualización:** 2026-01-25
