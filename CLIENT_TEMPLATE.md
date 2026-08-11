# Guía Completa: Configuración de Cliente Radio PWA

Esta guía te ayudará a crear y configurar un nuevo cliente usando el template `cliente-test-radio`.

## Estructura del repo del cliente

```
cliente-radio/
├── config/
│   └── config.json          ← Configuración única del cliente
├── assets/
│   └── icons/               ← Iconos personalizados del cliente
│       ├── icon-72x72.png
│       ├── icon-96x96.png
│       ├── icon-128x128.png
│       ├── icon-144x144.png
│       ├── icon-152x152.png
│       ├── icon-192x192.png
│       ├── icon-384x384.png
│       └── icon-512x512.png
├── package.json             ← Instala el core
├── .npmrc                   ← Configuración de GitHub Packages
└── README.md
```

## package.json del cliente

```json
{
  "name": "cliente-radio",
  "version": "1.0.0",
  "private": true,
  "description": "Radio PWA para [Nombre del Cliente]",
  "scripts": {
    "start": "node node_modules/@felipevegaesparza/radio-pwa-core/server.js",
    "dev": "node node_modules/@felipevegaesparza/radio-pwa-core/server.js"
  },
  "dependencies": {
    "@felipevegaesparza/radio-pwa-core": "^1.0.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

## .npmrc del cliente

```
@felipevegaesparza:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

## config/config.json del cliente

```json
{
  "template": "blue",
  "project_name": "Radio Cliente",
  "clientId": "ID_DEL_CLIENTE_EN_IPSTREAM",
  "ipstream_base_url": "https://dashboard.ipstream.cl/api/public",
  "sonicpanel_stream_url": "https://stream.ipstream.cl/PUERTO/stream",
  "sonicpanel_api_url": "https://stream.ipstream.cl/cp/get_info.php?p=PUERTO",
  "cache_version": "v1",
  "offline_page": "/offline.html",
  "pagination": {
    "news_per_page": 10,
    "podcasts_per_page": 10,
    "videocasts_per_page": 10
  }
}
```

## Requisitos Previos

- Cuenta de GitHub
- Acceso al repositorio template `cliente-test-radio`
- Token de GitHub con permisos `read:packages` (el mismo que usas para el core)
- Cuenta en Dockploy (o plataforma de deployment)

---

## Paso 1: Crear Nuevo Repositorio desde Template

1. Ve a: https://github.com/FelipeVegaEsparza/cliente-test-radio
2. Click en **"Use this template"** → **"Create a new repository"**
3. Configuración del nuevo repo:
   - **Repository name**: `cliente-[nombre-radio]` (ejemplo: `cliente-radio-rock`)
   - **Description**: "PWA para [Nombre de la Radio]"
   - **Visibility**: Private (recomendado para clientes)
4. Click en **"Create repository"**

---

## Paso 2: Configurar Secret NPM_TOKEN

Este secret permite que GitHub Actions instale el package del core.

1. En tu nuevo repositorio, ve a: **Settings** → **Secrets and variables** → **Actions**
2. Click en **"New repository secret"**
3. Configuración:
   - **Name**: `NPM_TOKEN`
   - **Value**: [Tu Personal Access Token de GitHub]
4. Click en **"Add secret"**

**IMPORTANTE**: Usa el mismo token `NPM_TOKEN` para todos tus clientes. No necesitas crear un token diferente para cada uno.

### ¿No tienes un token? Créalo aquí:

1. Ve a: https://github.com/settings/tokens
2. Click en **"Generate new token"** → **"Generate new token (classic)"**
3. Configuración del token:
   - **Note**: "NPM Package Access"
   - **Expiration**: No expiration (o el tiempo que prefieras)
   - **Permisos necesarios**:
     - ✅ `read:packages`
     - ✅ `write:packages`
     - ✅ `repo`
4. Click en **"Generate token"**
5. **COPIA EL TOKEN** (no podrás verlo de nuevo)

---

## Paso 3: Configurar Permisos de GitHub Actions

Esto permite que el workflow haga commits automáticos cuando se actualice el core.

1. En tu repositorio, ve a: **Settings** → **Actions** → **General**
2. Scroll hasta **"Workflow permissions"**
3. Selecciona: **"Read and write permissions"**
4. Marca: ✅ **"Allow GitHub Actions to create and approve pull requests"**
5. Click en **"Save"**

---

## Paso 4: Personalizar Archivos del Cliente

### 4.1 Editar `config/config.json`

Personaliza con los datos de tu cliente:

```json
{
  "project_name": "Radio Rock FM",
  "template": "dark",
  "clientId": "cliente-rock-fm",
  "ipstream_base_url": "https://dashboard.ipstream.cl/api/public",
  "sonicpanel_stream_url": "https://stream.ipstream.cl:8000/stream",
  "sonicpanel_port": "8000",
  "sonicpanel_api_url": "https://stream.ipstream.cl/cp/get_info.php?p=8000",
  "cache_version": "v1",
  "offline_page": "/offline.html",
  "pagination": {
    "news_per_page": 10,
    "podcasts_per_page": 10,
    "videocasts_per_page": 10
  }
}
```

**Campos importantes**:
- `project_name`: Nombre de la radio (se muestra en la app)
- `template`: Template visual (blue, dark, minimalista, etc.)
- `clientId`: ID único del cliente en IPStream
- `sonicpanel_port`: Puerto del stream (se extrae automáticamente de la URL si no se especifica)

### 4.2 Reemplazar Iconos en `assets/icons/`

Genera iconos personalizados del cliente en estos tamaños:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

**Tip**: Usa herramientas como [RealFaviconGenerator](https://realfavicongenerator.net/) para generar todos los tamaños automáticamente.

### 4.3 Editar `manifest.json`

Personaliza el manifest de la PWA:

```json
{
  "name": "Radio Rock FM",
  "short_name": "Rock FM",
  "description": "Escucha Radio Rock FM en vivo 24/7",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#ff0000",
  "icons": [
    {
      "src": "/assets/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/assets/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## Paso 5: Hacer Commit y Push

```bash
git add .
git commit -m "feat: configuración inicial del cliente"
git push origin main
```

---

## Paso 6: Desplegar en Dockploy

### 6.1 Crear Nuevo Proyecto en Dockploy

1. Login en tu panel de Dockploy
2. Click en **"New Project"**
3. Selecciona **"GitHub Repository"**
4. Conecta tu repositorio `cliente-[nombre-radio]`

### 6.2 Configurar Build Settings

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Port**: `3000`
- **Node Version**: `18` o superior

### 6.3 Variables de Entorno (opcional)

Si necesitas configurar variables de entorno adicionales:
- `PORT`: 3000
- `NODE_ENV`: production

### 6.4 Deploy

1. Click en **"Deploy"**
2. Espera a que termine el build (~2-3 minutos)
3. Tu app estará disponible en la URL asignada por Dockploy

---

## Paso 7: Verificar Auto-Actualización

El workflow de auto-actualización se ejecutará automáticamente cada 6 horas. Para probarlo manualmente:

1. Ve a tu repositorio en GitHub
2. Click en **"Actions"**
3. Selecciona **"Auto Update Core Package"**
4. Click en **"Run workflow"** → **"Run workflow"**
5. Espera a que termine (debería tomar ~1 minuto)

### ¿Cómo funciona la auto-actualización?

Cuando publicas una nueva versión del core (`@felipevegaesparza/radio-pwa-core`):

1. ⏰ El workflow de GitHub Actions en cada cliente se ejecuta cada 6 horas
2. 📦 Ejecuta `npm update @felipevegaesparza/radio-pwa-core`
3. ✅ Si hay una nueva versión, actualiza `package.json` y `package-lock.json`
4. 💾 Hace commit y push automáticamente
5. 🚀 Dockploy detecta el cambio y redespliega automáticamente

**Resultado**: Todos tus clientes se actualizan automáticamente sin intervención manual.

---

## Flujo Completo de Actualización

```
1. Haces cambios en el core (app-pwa-hostreams)
   ↓
2. Incrementas versión en package.json (ej: 1.0.8 → 1.0.9)
   ↓
3. Push a main
   ↓
4. GitHub Actions publica nueva versión automáticamente
   ↓
5. Cada 6 horas, los clientes ejecutan auto-update
   ↓
6. npm update descarga la nueva versión
   ↓
7. Commit automático en cada cliente
   ↓
8. Dockploy detecta el cambio y redespliega
   ↓
9. ✅ Todos los clientes actualizados sin intervención manual
```

---

## Troubleshooting

### ❌ Error 401 al instalar package

**Solución**:
1. Verifica que el secret `NPM_TOKEN` esté configurado en: **Settings** → **Secrets and variables** → **Actions**
2. Verifica que el token tenga permisos `read:packages`
3. Verifica que el archivo `.npmrc` exista en el repositorio con este contenido:
   ```
   @felipevegaesparza:registry=https://npm.pkg.github.com
   ```

### ❌ El workflow no se ejecuta automáticamente

**Solución**:
1. Verifica que los permisos de GitHub Actions estén en **"Read and write"**
2. Verifica que el workflow esté en `.github/workflows/auto-update.yml`
3. Ejecuta el workflow manualmente una vez para activarlo

### ❌ La app no inicia en Dockploy

**Solución**:
1. Verifica que `package.json` tenga el script `start` correcto:
   ```json
   "start": "node node_modules/@felipevegaesparza/radio-pwa-core/server.js"
   ```
2. Verifica que el puerto sea `3000`
3. Revisa los logs de Dockploy para más detalles
4. Verifica que `config/config.json` exista y tenga el formato correcto

### ❌ Dockploy no redespliega automáticamente

**Solución**:
1. En Dockploy, verifica que **"Auto Deploy"** esté activado
2. Verifica que el webhook de GitHub esté configurado correctamente
3. Prueba hacer un push manual para verificar que el webhook funciona

### ❌ El template no cambia desde el dashboard de IPStream

**Solución**:
1. Verifica que `clientId` en `config.json` sea correcto
2. Verifica que `ipstream_base_url` apunte a la API correcta
3. Revisa los logs del servidor para ver si hay errores al consultar la API
4. El cambio de template es instantáneo, no requiere rebuild

---

## Próximos Pasos

Una vez que tu cliente esté funcionando:

1. ✅ Configura el dominio personalizado en Dockploy
2. ✅ Configura SSL/HTTPS (Dockploy lo hace automáticamente)
3. ✅ Prueba la PWA en dispositivos móviles
4. ✅ Verifica que el cambio de template desde IPStream funcione
5. ✅ Configura notificaciones push (si aplica)

---

## Resumen: ¿Qué hace cada archivo?

| Archivo | Propósito |
|---------|-----------|
| `package.json` | Define la dependencia del core y scripts de inicio |
| `.npmrc` | Configura autenticación con GitHub Packages |
| `config/config.json` | Configuración única del cliente (nombre, template, URLs) |
| `assets/icons/` | Iconos personalizados del cliente para la PWA |
| `manifest.json` | Configuración de la PWA (nombre, colores, iconos) |
| `.github/workflows/auto-update.yml` | Workflow que actualiza el core automáticamente |

---

## Soporte

Si tienes problemas, revisa:
- 📋 Los logs de GitHub Actions (tab "Actions" en GitHub)
- 📋 Los logs de Dockploy (en el panel de tu proyecto)
- 📋 El archivo `config/config.json`
- 📋 Que el secret `NPM_TOKEN` esté configurado correctamente

---

## Checklist de Deployment

Usa este checklist para cada nuevo cliente:

- [ ] Crear repo desde template `cliente-test-radio`
- [ ] Configurar secret `NPM_TOKEN`
- [ ] Configurar permisos "Read and write" en GitHub Actions
- [ ] Personalizar `config/config.json`
- [ ] Reemplazar iconos en `assets/icons/`
- [ ] Personalizar `manifest.json`
- [ ] Commit y push
- [ ] Crear proyecto en Dockploy
- [ ] Configurar build settings (npm install, npm start, port 3000)
- [ ] Deploy
- [ ] Probar workflow de auto-actualización manualmente
- [ ] Verificar que la app funcione correctamente
- [ ] Configurar dominio personalizado (opcional)
- [ ] Probar cambio de template desde IPStream
