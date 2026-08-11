# 🔍 Guía de Diagnóstico TV Online

## 🚨 **Problema: El video no carga**

### **Paso 1: Verificar en la Consola del Navegador**

Abre las herramientas de desarrollador (F12) y busca estos mensajes:

```
RadioPulsePlayer: Video URL obtenida: [URL_AQUI]
RadioPulsePlayer: TV Online available with URL: [URL_AQUI]
```

### **Paso 2: Ejecutar Diagnóstico Manual**

Copia y pega este código en la consola:

```javascript
// === DIAGNÓSTICO COMPLETO ===
console.log('=== DIAGNÓSTICO TV ONLINE ===');

// 1. Verificar instancia del player
const player = window.radioPulsePlayer;
console.log('Player instance:', !!player);

if (player) {
  console.log('Video URL:', player.videoStreamUrl);
  
  // 2. Verificar API directamente
  player.checkTVAvailability().then(() => {
    console.log('Verificación completada');
  });
  
  // 3. Mostrar popup de debug
  player.showDebugPopup();
}

// 4. Verificar API manualmente
import('/assets/js/api.js').then(api => {
  api.getBasicData().then(data => {
    console.log('Basic Data completa:', data);
    console.log('videoStreamingUrl en API:', data.videoStreamingUrl);
  });
});
```

### **Paso 3: Probar con Video de Ejemplo**

Si no hay URL configurada, el popup mostrará un botón "🧪 Probar con video de ejemplo". Haz click para verificar que el reproductor funciona.

### **Paso 4: Verificar Configuración en IPStream**

1. **Accede al panel de IPStream**
2. **Ve a la configuración de tu radio**
3. **Busca el campo "Video Streaming URL" o "videoStreamingUrl"**
4. **Debe contener una URL válida (preferiblemente .m3u8 para HLS)**

### **Ejemplo de URL válida:**
```
https://ejemplo.com/stream/video.m3u8
```

## 🛠️ **Posibles Problemas y Soluciones**

### **Problema 1: No hay URL configurada**
**Síntoma:** El botón "TV Online" no aparece
**Solución:** Configurar `videoStreamingUrl` en el panel de IPStream

### **Problema 2: URL no válida**
**Síntoma:** El reproductor muestra error
**Solución:** Verificar que la URL sea accesible y del formato correcto

### **Problema 3: CORS bloqueado**
**Síntoma:** Error de CORS en la consola
**Solución:** El servidor de video debe permitir CORS desde tu dominio

### **Problema 4: Formato no soportado**
**Síntoma:** Video no se reproduce
**Solución:** Usar formato HLS (.m3u8) o MP4

## 📋 **Checklist de Verificación**

- [ ] ✅ El botón "TV Online" es visible
- [ ] ❓ Hay URL de video en la consola
- [ ] ❓ La URL es accesible (no da error 404)
- [ ] ❓ El formato es compatible (.m3u8, .mp4)
- [ ] ❓ No hay errores CORS
- [ ] ❓ El video de prueba funciona

## 🎯 **Comandos de Debug Rápido**

```javascript
// Ver URL de video actual
console.log(window.radioPulsePlayer?.videoStreamUrl);

// Probar con video de ejemplo
window.radioPulsePlayer?.testWithSampleVideo();

// Ver datos completos de la API
import('/assets/js/api.js').then(api => {
  api.getAllClientData().then(console.log);
});
```

## 📞 **Información para Reportar**

Si el problema persiste, comparte esta información:

1. **URL de video mostrada en la consola**
2. **Errores en la consola del navegador**
3. **¿Funciona el video de prueba?**
4. **Tipo de navegador y versión**

## 🔧 **Solución Temporal**

Si necesitas probar inmediatamente, puedes forzar una URL de prueba:

```javascript
// Forzar URL de prueba
window.radioPulsePlayer.videoStreamUrl = 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';
window.radioPulsePlayer.openTVPopup();
```