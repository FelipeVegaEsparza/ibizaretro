# Guía de Setup para Nuevo Cliente

## Paso 1: Crear nuevo repositorio en GitHub

1. Ve a GitHub y crea un nuevo repositorio
2. Nombre: `cliente-[nombre]-radio` (ejemplo: `cliente-fusion-radio`)
3. Privado o Público según prefieras
4. NO inicialices con README, .gitignore ni licencia

## Paso 2: Crear estructura local

En tu computadora, crea una carpeta para el cliente:

```bash
mkdir cliente-nombre-radio
cd cliente-nombre-radio
```

## Paso 3: Crear archivos necesarios

### 3.1 - package.json

```json
{
  "name": "cliente-nombre-radio",
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

### 3.2 - .npmrc

```
@felipevegaesparza:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

### 3.3 - config/config.json

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

### 3.4 - .gitignore

```
node_modules/
.env
.DS_Store
npm-debug.log*
```

### 3.5 - README.md

```markdown
# Radio [Nombre del Cliente]

PWA de radio para [Nombre del Cliente]

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm start
```
```

### 3.6 - Crear carpeta de iconos

```bash
mkdir -p assets/icons
```

Copia los iconos personalizados del cliente en `assets/icons/`:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Paso 4: Configurar GitHub Secret

1. Ve al repo del cliente en GitHub
2. Settings → Secrets and variables → Actions
3. New repository secret
4. Name: `NPM_TOKEN`
5. Value: [el mismo token que usaste en el repo core]

## Paso 5: Inicializar Git y hacer push

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/FelipeVegaEsparza/cliente-nombre-radio.git
git push -u origin main
```

## Paso 6: Instalar dependencias

```bash
export NPM_TOKEN=tu_token_aqui
npm install
```

## Paso 7: Probar localmente

```bash
npm start
```

Abre http://localhost:3000 y verifica que funciona.

## Paso 8: Configurar Dockploy

1. Ve a tu panel de Dockploy
2. Crea nueva aplicación
3. Conecta el repositorio de GitHub
4. Configura las variables de entorno:
   - `NPM_TOKEN`: tu token de GitHub
5. Deploy automático está listo

## Actualización automática del core

Cuando publiques una nueva versión del core (`@felipevegaesparza/radio-pwa-core`), puedes actualizar el cliente de dos formas:

### Opción 1: Manual
```bash
npm update @felipevegaesparza/radio-pwa-core
git add package.json package-lock.json
git commit -m "Update core to latest version"
git push
```

### Opción 2: Automática (próximo paso)
Crearemos un GitHub Action que detecte nuevas versiones y actualice automáticamente.
