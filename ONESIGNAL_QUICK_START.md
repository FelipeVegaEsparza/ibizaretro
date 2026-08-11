# OneSignal - Guía de Implementación Rápida

## ⚡ Implementación en 3 Pasos

### Paso 1: Agregar CSS (en el `<head>`)

```html
<link rel="stylesheet" href="/assets/css/notification-button.css">
```

### Paso 2: Agregar el Contenedor (donde quieras el botón)

```html
<div id="notification-button-container"></div>
```

Ubicaciones recomendadas:
- En el header junto a los iconos sociales
- En el sidebar/menú lateral
- En la barra de navegación
- Como botón flotante

### Paso 3: Agregar el Script (antes del cierre de `</body>`)

```html
<script type="module" src="/assets/js/onesignal-init.js"></script>
```

## ✅ ¡Listo!

El sistema se encargará automáticamente de:
- Verificar si el cliente tiene OneSignal configurado
- Inicializar OneSignal
- Mostrar el botón solo si está soportado
- Manejar suscripciones
- Actualizar el estado del botón

## 📍 Ejemplo Completo

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Mi Radio</title>
  
  <!-- Tus estilos -->
  <link rel="stylesheet" href="assets/css/style.css">
  
  <!-- OneSignal CSS -->
  <link rel="stylesheet" href="/assets/css/notification-button.css">
</head>
<body>
  
  <header>
    <div class="logo">Mi Radio</div>
    
    <!-- Botón de notificaciones -->
    <div id="notification-button-container"></div>
    
    <nav>
      <!-- Tu navegación -->
    </nav>
  </header>
  
  <main>
    <!-- Tu contenido -->
  </main>
  
  <!-- Tus scripts -->
  <script type="module" src="assets/js/main.js"></script>
  
  <!-- OneSignal Init -->
  <script type="module" src="/assets/js/onesignal-init.js"></script>
  
</body>
</html>
```

## 🎨 Personalización Rápida

### Cambiar Colores

Edita `/assets/css/notification-button.css`:

```css
.notification-btn {
  background: linear-gradient(135deg, #TU-COLOR-1 0%, #TU-COLOR-2 100%);
}
```

### Cambiar Posición

```css
#notification-button-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}
```

### Cambiar Tamaño

```css
.notification-btn {
  padding: 12px 20px;
  font-size: 16px;
}
```

## 🔍 Verificar que Funciona

1. Abre la consola del navegador (F12)
2. Busca estos mensajes:
   ```
   OneSignal: Iniciando...
   OneSignal: Inicializado correctamente
   ```
3. Si ves el botón, ¡funciona! 🎉
4. Si no ves el botón, el cliente no tiene OneSignal configurado o el navegador no lo soporta

## 🐛 Problemas Comunes

### El botón no aparece

**Causa:** El cliente no tiene `oneSignalAppId` configurado en el panel

**Solución:** Esto es normal. El botón solo aparece si el cliente configuró OneSignal.

### Error en consola

**Causa:** Ruta incorrecta a los archivos

**Solución:** Verifica que las rutas sean correctas:
- `/assets/css/notification-button.css`
- `/assets/js/onesignal-init.js`

### El botón aparece pero no funciona

**Causa:** El sitio no está en HTTPS

**Solución:** En producción, usa HTTPS. En desarrollo, `localhost` funciona.

## 📱 Templates Implementados

- ✅ **Minimalista** - Ya implementado como ejemplo
- ⬜ **Clasico** - Pendiente
- ⬜ **Dark** - Pendiente
- ⬜ **Blue** - Pendiente
- ⬜ **Otros** - Pendiente

## 🚀 Próximos Pasos

1. Implementa en tu template favorito
2. Prueba en diferentes navegadores
3. Envía una notificación de prueba desde el panel
4. Personaliza los estilos según tu diseño

## 📚 Documentación Completa

Para más detalles, consulta:
- `ONESIGNAL_INTEGRATION.md` - Documentación completa
- `assets/js/onesignal-manager.js` - API del manager
- `assets/js/notification-button.js` - Componente del botón

## 💡 Tips

- El botón es responsive y se adapta a móviles
- En móviles pequeños solo muestra el icono
- El botón tiene animaciones suaves
- El estado se actualiza automáticamente
- No necesitas escribir código JavaScript adicional

## ✨ Características

- ✅ Inicialización automática
- ✅ Detección de soporte
- ✅ Manejo de estados
- ✅ Responsive design
- ✅ Animaciones suaves
- ✅ Sin dependencias externas (excepto OneSignal SDK)
- ✅ Compatible con todos los templates
- ✅ Fácil de personalizar

---

**¿Necesitas ayuda?** Revisa la documentación completa en `ONESIGNAL_INTEGRATION.md`
