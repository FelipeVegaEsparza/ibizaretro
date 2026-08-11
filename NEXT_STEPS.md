# 🎯 Próximos Pasos para Completar el Sistema

## Estado Actual ✅

Has completado exitosamente:

1. ✅ Core publicado como package npm `@felipevegaesparza/radio-pwa-core` v1.0.8
2. ✅ Sistema de templates dinámicos desde API de IPStream
3. ✅ `cliente-test-radio` creado y funcionando
4. ✅ Deployment en Dockploy configurado
5. ✅ Workflow de auto-actualización creado

---

## Lo que Falta por Hacer 🚀

### 1. Copiar el Workflow al Repositorio del Cliente

El archivo `.github/workflows/auto-update-client-example.yml` que creé aquí en el core es solo un **ejemplo**.

**Debes copiarlo al repositorio `cliente-test-radio`**:

#### Opción A: Manualmente en GitHub

1. Ve a: https://github.com/FelipeVegaEsparza/cliente-test-radio
2. Crea la carpeta `.github/workflows/` si no existe
3. Crea el archivo `auto-update.yml` con este contenido:

```yaml
name: Auto Update Core Package

on:
  schedule:
    # Ejecutar cada 6 horas
    - cron: '0 */6 * * *'
  workflow_dispatch: # Permitir ejecución manual

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: read
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://npm.pkg.github.com'

      - name: Configure npm authentication
        run: |
          echo "@felipevegaesparza:registry=https://npm.pkg.github.com" > .npmrc
          echo "//npm.pkg.github.com/:_authToken=${{ secrets.NPM_TOKEN }}" >> .npmrc

      - name: Update core package
        run: |
          npm update @felipevegaesparza/radio-pwa-core
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Check for changes
        id: check_changes
        run: |
          if git diff --quiet package-lock.json; then
            echo "changes=false" >> $GITHUB_OUTPUT
          else
            echo "changes=true" >> $GITHUB_OUTPUT
          fi

      - name: Commit and push if changed
        if: steps.check_changes.outputs.changes == 'true'
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add package-lock.json package.json
          git commit -m "chore: auto-update @felipevegaesparza/radio-pwa-core"
          git push
```

#### Opción B: Desde tu máquina local

Si tienes el repo `cliente-test-radio` clonado localmente:

```bash
cd cliente-test-radio
mkdir -p .github/workflows
# Copia el contenido del workflow aquí
git add .github/workflows/auto-update.yml
git commit -m "feat: add auto-update workflow"
git push origin main
```

---

### 2. Probar el Workflow Manualmente

Una vez que el workflow esté en el repo del cliente:

1. Ve a: https://github.com/FelipeVegaEsparza/cliente-test-radio/actions
2. Click en **"Auto Update Core Package"**
3. Click en **"Run workflow"** → **"Run workflow"**
4. Espera ~1 minuto
5. Verifica que termine exitosamente (✅ verde)

**Si falla con error 401**:
- Verifica que el secret `NPM_TOKEN` esté configurado
- Verifica que los permisos de GitHub Actions sean "Read and write"

---

### 3. Convertir `cliente-test-radio` en Template Repository

Para que puedas crear nuevos clientes fácilmente:

1. Ve a: https://github.com/FelipeVegaEsparza/cliente-test-radio/settings
2. Scroll hasta **"Template repository"**
3. Marca: ✅ **"Template repository"**
4. Click en **"Save"**

Ahora podrás crear nuevos clientes con 1 click usando "Use this template".

---

### 4. Probar el Sistema Completo

Para verificar que todo funciona:

#### Test 1: Actualización Manual del Core

1. En el core (`app-pwa-hostreams`), incrementa la versión:
   ```json
   "version": "1.0.9"
   ```
2. Haz un cambio pequeño (ej: agregar un console.log)
3. Commit y push
4. Espera ~1 minuto a que se publique
5. Ve al cliente y ejecuta el workflow manualmente
6. Verifica que se actualice automáticamente

#### Test 2: Cambio de Template desde IPStream

1. Abre la app del cliente en el navegador
2. Desde el dashboard de IPStream, cambia el `selectedTemplate`
3. Recarga la página del cliente
4. Verifica que el template cambie instantáneamente (sin rebuild)

---

### 5. Desplegar tus 30 Clientes

Ahora que tienes el sistema funcionando, puedes desplegar tus 30 clientes:

**Para cada cliente**:

1. Crear repo desde template `cliente-test-radio` (1 click)
2. Configurar secret `NPM_TOKEN` (copiar/pegar el mismo token)
3. Configurar permisos "Read and write" en GitHub Actions
4. Personalizar `config/config.json`, iconos y `manifest.json`
5. Commit y push
6. Crear proyecto en Dockploy
7. Deploy

**Tiempo estimado por cliente**: 10-15 minutos

**Tiempo total para 30 clientes**: ~5-7 horas

---

## Ventajas del Sistema Actual

✅ **Actualizaciones automáticas**: Publicas una vez, todos se actualizan
✅ **Templates dinámicos**: Los clientes cambian de template sin rebuild
✅ **Configuración mínima**: Solo 3 archivos por cliente
✅ **Escalable**: Puedes tener 100+ clientes sin problema
✅ **Mantenible**: Todo el código está en el core
✅ **Deployment automático**: Dockploy redespliega automáticamente

---

## Comandos Útiles

### Publicar nueva versión del core

```bash
cd app-pwa-hostreams
# Editar package.json: incrementar version
git add .
git commit -m "feat: nueva característica"
git push origin main
# GitHub Actions publica automáticamente
```

### Crear nuevo cliente

```bash
# En GitHub:
# 1. Use template → Create repository
# 2. Configurar secrets y permisos
# 3. Personalizar archivos
# 4. Push
# 5. Deploy en Dockploy
```

### Verificar versión instalada en un cliente

```bash
cd cliente-[nombre]
cat package-lock.json | grep "@felipevegaesparza/radio-pwa-core" -A 2
```

---

## Preguntas Frecuentes

### ¿Puedo tener diferentes versiones del core en diferentes clientes?

Sí, pero no es recomendado. El sistema está diseñado para que todos usen la última versión. Si necesitas versiones diferentes, puedes:
- Fijar la versión en `package.json`: `"@felipevegaesparza/radio-pwa-core": "1.0.8"`
- Desactivar el workflow de auto-actualización

### ¿Qué pasa si un cliente tiene cambios personalizados?

Los clientes NO deben tener cambios en el código. Solo deben personalizar:
- `config/config.json`
- `assets/icons/`
- `manifest.json`

Todo el código debe estar en el core.

### ¿Cómo hago rollback si una actualización tiene bugs?

1. En el core, revierte el commit problemático
2. Incrementa la versión
3. Push
4. Los clientes se actualizarán automáticamente a la versión corregida

### ¿Puedo ejecutar el workflow más frecuentemente?

Sí, edita el cron en `.github/workflows/auto-update.yml`:
- Cada hora: `0 * * * *`
- Cada 30 minutos: `*/30 * * * *`
- Cada día a las 3am: `0 3 * * *`

---

## Resumen

**Lo que tienes que hacer ahora**:

1. Copiar el workflow al repo `cliente-test-radio`
2. Probar el workflow manualmente
3. Convertir `cliente-test-radio` en template repository
4. Probar actualización del core
5. Empezar a desplegar tus 30 clientes

**Tiempo estimado**: 30 minutos para completar los pasos 1-4

¡El sistema está casi listo! 🚀
