# 🔍 Cómo la PWA Obtiene los Datos de OneSignal del Cliente

## 📋 Resumen Ejecutivo

La PWA obtiene el **OneSignal App ID** del cliente a través de una **API pública** del panel de administración. El flujo es completamente automático y no requiere configuración manual en la PWA.

---

## 🔄 Flujo Completo

```
1. PWA se carga
   ↓
2. Lee config.json local
   ├─ clientId: "cmf4du07u000313x255b7jy2t"
   └─ ipstream_base_url: "https://dashboard.ipstream.cl/api/public"
   ↓
3. Construye URL de la API
   → https://dashboard.ipstream.cl/api/public/cmf4du07u000313x255b7jy2t
   ↓
4. Hace fetch a la API
   ↓
5. API retorna datos del cliente:
   {
     "client": { ... },
     "oneSignalAppId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",  ← AQUÍ
     "basicData": { ... },
     "socialNetworks": { ... },
     ...
   }
   ↓
6. OneSignal Manager extrae el oneSignalAppId
   ↓
7. Si existe → Inicializa OneSignal con ese App ID
   Si no existe → No hace nada (silencioso)
```

---

## 📁 Archivos Involucrados

### 1. `config/config.json` (Local en la PWA)

```json
{
  "clientId": "cmf4du07u000313x255b7jy2t",
  "ipstream_base_url": "https://dashboard.ipstream.cl/api/public"
}
```

**Propósito:**
- Almacena el ID único del cliente
- Define la URL base de la API del panel

**Ubicación:** Local en cada PWA

---

### 2. `assets/js/config.js` (Carga la configuración)

```javascript
async function loadConfig() {
  const response = await fetch('/config/config.json');
  return await response.json();
}

export const config = loadConfig();
```

**Propósito:**
- Carga el archivo `config.json`
- Exporta la configuración para uso en otros módulos

---

### 3. `assets/js/api.js` (Construye y llama a la API)

```javascript
import { config } from './config.js';

async function getApiBase() {
  const configData = await config;
  // Construye: https://dashboard.ipstream.cl/api/public/cmf4du07u000313x255b7jy2t
  return `${configData.ipstream_base_url}/${configData.clientId}`;
}

export async function getAllClientData() { 
  const base = await getApiBase();
  // Hace fetch a: https://dashboard.ipstream.cl/api/public/cmf4du07u000313x255b7jy2t
  return await fetchJSON(`${base}`); 
}
```

**Propósito:**
- Construye la URL completa de la API
- Hace el fetch y retorna los datos del cliente

---

### 4. `assets/js/onesignal-manager.js` (Usa el App ID)

```javascript
import { getAllClientData } from './api.js';

async init() {
  // 1. Obtener datos del cliente desde la API
  const clientData = await getAllClientData();
  
  // 2. Verificar si tiene OneSignal configurado
  if (!clientData.oneSignalAppId) {
    console.log('OneSignal: Cliente no tiene OneSignal configurado');
    return false;
  }

  // 3. Guardar el App ID
  this.oneSignalAppId = clientData.oneSignalAppId;

  // 4. Inicializar OneSignal con ese App ID
  window.OneSignal.init({
    appId: this.oneSignalAppId,  // ← Usa el App ID obtenido de la API
    // ...
  });
}
```

**Propósito:**
- Obtiene el `oneSignalAppId` de la API
- Inicializa OneSignal con ese App ID

---

## 🌐 API del Panel de Administración

### Endpoint

```
GET https://dashboard.ipstream.cl/api/public/{clientId}
```

### Ejemplo de Request

```http
GET https://dashboard.ipstream.cl/api/public/cmf4du07u000313x255b7jy2t
```

### Ejemplo de Response

```json
{
  "client": {
    "id": "cmf4du07u000313x255b7jy2t",
    "name": "Radio Fusion Austral"
  },
  "selectedTemplate": "minimalista",
  "oneSignalAppId": "12345678-1234-1234-1234-123456789012",  ← ESTE CAMPO
  "basicData": {
    "logoUrl": "/uploads/logo.png",
    "description": "Radio desde la Patagonia",
    ...
  },
  "socialNetworks": {
    "facebook": "https://facebook.com/...",
    "instagram": "https://instagram.com/...",
    ...
  },
  "programs": [...],
  "news": [...],
  ...
}
```

### Campo Importante

```json
"oneSignalAppId": "12345678-1234-1234-1234-123456789012"
```

**Tipo:** `string | null`
- Si el cliente tiene OneSignal configurado → Retorna el App ID (UUID)
- Si el cliente NO tiene OneSignal configurado → Retorna `null`

---

## 🔐 Configuración en el Panel de Administración

### Dónde se Configura

El administrador del panel configura el OneSignal App ID en:

```
/admin/users → Seleccionar cliente → Configuración de OneSignal
```

### Campos Requeridos

1. **OneSignal App ID**
   - Formato: UUID (ej: `12345678-1234-1234-1234-123456789012`)
   - Se obtiene del dashboard de OneSignal
   - Se almacena en la base de datos del panel

2. **OneSignal REST API Key** (opcional para la PWA)
   - Solo se usa en el backend del panel
   - No se expone en la API pública
   - Se usa para enviar notificaciones desde el panel

### Flujo de Configuración

```
1. Administrador entra al panel
   ↓
2. Va a /admin/users
   ↓
3. Selecciona un cliente
   ↓
4. Ingresa el OneSignal App ID del cliente
   ↓
5. Guarda la configuración
   ↓
6. El App ID se almacena en la base de datos
   ↓
7. La API pública expone el App ID
   ↓
8. La PWA del cliente lo obtiene automáticamente
```

---

## 🔍 Verificación Paso a Paso

### 1. Verificar el clientId Local

```bash
# Ver el config.json
cat config/config.json
```

Busca:
```json
{
  "clientId": "cmf4du07u000313x255b7jy2t"
}
```

### 2. Verificar la API

Abre en tu navegador:
```
https://dashboard.ipstream.cl/api/public/cmf4du07u000313x255b7jy2t
```

Busca en la respuesta:
```json
{
  "oneSignalAppId": "..."
}
```

### 3. Verificar en la Consola del Navegador

```javascript
// 1. Ver la configuración local
fetch('/config/config.json')
  .then(r => r.json())
  .then(config => console.log('Config:', config));

// 2. Ver los datos de la API
fetch('https://dashboard.ipstream.cl/api/public/cmf4du07u000313x255b7jy2t')
  .then(r => r.json())
  .then(data => console.log('API Data:', data));

// 3. Ver el oneSignalAppId específicamente
fetch('https://dashboard.ipstream.cl/api/public/cmf4du07u000313x255b7jy2t')
  .then(r => r.json())
  .then(data => console.log('OneSignal App ID:', data.oneSignalAppId));
```

### 4. Verificar en OneSignal Manager

```javascript
// En la consola del navegador
window.oneSignalManager.oneSignalAppId
// Debe retornar: "12345678-1234-1234-1234-123456789012"
```

---

## 🎯 Casos de Uso

### Caso 1: Cliente CON OneSignal Configurado

```
1. PWA hace fetch a la API
   ↓
2. API retorna:
   {
     "oneSignalAppId": "12345678-1234-1234-1234-123456789012"
   }
   ↓
3. OneSignal Manager detecta que existe
   ↓
4. Inicializa OneSignal con ese App ID
   ↓
5. Muestra el botón de notificaciones
   ↓
6. Usuario puede suscribirse
```

### Caso 2: Cliente SIN OneSignal Configurado

```
1. PWA hace fetch a la API
   ↓
2. API retorna:
   {
     "oneSignalAppId": null
   }
   ↓
3. OneSignal Manager detecta que es null
   ↓
4. NO inicializa OneSignal
   ↓
5. NO muestra el botón de notificaciones
   ↓
6. La PWA funciona normalmente sin notificaciones
```

### Caso 3: Error en la API

```
1. PWA hace fetch a la API
   ↓
2. API retorna error (500, 404, etc.)
   ↓
3. OneSignal Manager captura el error
   ↓
4. NO inicializa OneSignal
   ↓
5. La PWA funciona normalmente sin notificaciones
```

---

## 🔒 Seguridad

### ¿Es Seguro Exponer el App ID?

**SÍ**, es completamente seguro porque:

1. **El App ID es público por diseño**
   - OneSignal lo requiere en el frontend
   - No es una credencial secreta
   - Se usa solo para identificar la aplicación

2. **El REST API Key NO se expone**
   - Solo el backend del panel lo tiene
   - Se usa para enviar notificaciones
   - Nunca se envía a la PWA

3. **Permisos del usuario**
   - El usuario debe aceptar permisos explícitamente
   - No se pueden enviar notificaciones sin permiso
   - El usuario puede revocar permisos en cualquier momento

### Datos que SÍ se Exponen (Seguros)

- ✅ `oneSignalAppId` - App ID público de OneSignal
- ✅ `clientId` - ID del cliente en el sistema
- ✅ `basicData` - Datos públicos del cliente (logo, nombre, etc.)
- ✅ `socialNetworks` - Redes sociales públicas

### Datos que NO se Exponen (Privados)

- ❌ `oneSignalRestApiKey` - Clave secreta del backend
- ❌ Credenciales de usuario
- ❌ Datos sensibles del cliente
- ❌ Configuración interna del panel

---

## 📊 Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                         PANEL DE ADMIN                       │
│                                                              │
│  Admin configura:                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Cliente: Radio Fusion Austral                      │    │
│  │ OneSignal App ID: 12345678-1234-1234-1234-...     │    │
│  │ OneSignal REST API Key: [SECRETO]                 │    │
│  └────────────────────────────────────────────────────┘    │
│                           ↓                                  │
│                  [Guarda en Base de Datos]                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      API PÚBLICA                             │
│                                                              │
│  GET /api/public/{clientId}                                 │
│                                                              │
│  Retorna:                                                    │
│  {                                                           │
│    "oneSignalAppId": "12345678-1234-1234-1234-...",        │
│    "basicData": { ... },                                    │
│    ...                                                       │
│  }                                                           │
│                                                              │
│  ⚠️ NO retorna el REST API Key (es secreto)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                          PWA                                 │
│                                                              │
│  1. Lee config.json local                                   │
│     ├─ clientId: "cmf4du07u000313x255b7jy2t"              │
│     └─ ipstream_base_url: "https://dashboard.ipstream.cl" │
│                                                              │
│  2. Construye URL de la API                                 │
│     → https://dashboard.ipstream.cl/api/public/cmf4du...   │
│                                                              │
│  3. Hace fetch a la API                                     │
│                                                              │
│  4. Recibe oneSignalAppId                                   │
│                                                              │
│  5. Inicializa OneSignal con ese App ID                     │
│                                                              │
│  6. Usuario puede suscribirse a notificaciones              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       ONESIGNAL                              │
│                                                              │
│  - Recibe suscripciones de usuarios                         │
│  - Almacena tokens de dispositivos                          │
│  - Entrega notificaciones a usuarios                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Troubleshooting

### Problema: oneSignalAppId es null

**Causa:** El cliente no tiene OneSignal configurado en el panel

**Solución:**
1. Ir al panel de administración
2. Configurar el OneSignal App ID del cliente
3. Recargar la PWA

### Problema: Error al hacer fetch a la API

**Causa:** URL incorrecta o API no disponible

**Solución:**
1. Verificar que `ipstream_base_url` en `config.json` es correcto
2. Verificar que `clientId` es correcto
3. Verificar que la API está funcionando

### Problema: OneSignal no se inicializa

**Causa:** oneSignalAppId no es válido

**Solución:**
1. Verificar que el App ID tiene formato UUID
2. Verificar que el App ID existe en OneSignal
3. Verificar en la consola del navegador si hay errores

---

## 📝 Resumen

### ¿De dónde viene el oneSignalAppId?

1. **Origen:** Panel de administración (configurado por el admin)
2. **Almacenamiento:** Base de datos del panel
3. **Exposición:** API pública del panel
4. **Obtención:** PWA hace fetch a la API
5. **Uso:** OneSignal Manager lo usa para inicializar

### ¿Qué necesita la PWA?

- ✅ `clientId` en `config.json` (ya lo tiene)
- ✅ `ipstream_base_url` en `config.json` (ya lo tiene)
- ✅ Conexión a internet para hacer fetch a la API
- ✅ Que el cliente tenga OneSignal configurado en el panel

### ¿Qué NO necesita la PWA?

- ❌ Configurar manualmente el oneSignalAppId
- ❌ Tener el REST API Key
- ❌ Modificar código para cada cliente
- ❌ Configuración adicional

---

## ✅ Ventajas de Este Enfoque

1. **Centralizado:** Toda la configuración está en el panel
2. **Automático:** La PWA obtiene los datos automáticamente
3. **Seguro:** No expone credenciales secretas
4. **Escalable:** Funciona para múltiples clientes sin cambios
5. **Mantenible:** Un solo código para todos los clientes
6. **Flexible:** Fácil de actualizar desde el panel

---

**Última actualización:** 2026-01-25  
**Versión:** 1.1.0
