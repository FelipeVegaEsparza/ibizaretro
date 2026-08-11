#!/usr/bin/env node

/**
 * PWA Icon Generator Script (Canvas Version)
 * Genera todos los iconos PWA necesarios usando Canvas
 * 
 * Uso: node generate-icons-canvas.js [ruta-imagen-base]
 * Ejemplo: node generate-icons-canvas.js logo.png
 */

const fs = require('fs');
const path = require('path');

// Verificar si canvas está disponible
let { createCanvas, loadImage } = {};
try {
  ({ createCanvas, loadImage } = require('canvas'));
} catch (error) {
  console.error('❌ Error: canvas no está instalado.');
  console.log('📦 Instala canvas ejecutando: npm install canvas');
  console.log('💡 O usa la versión con sharp: node generate-icons.js');
  process.exit(1);
}

// Tamaños de iconos necesarios para PWA
const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png', description: 'Badge y notificaciones pequeñas' },
  { size: 96, name: 'icon-96x96.png', description: 'Dispositivos de baja resolución' },
  { size: 128, name: 'icon-128x128.png', description: 'Chrome Web Store' },
  { size: 144, name: 'icon-144x144.png', description: 'Windows tiles' },
  { size: 152, name: 'icon-152x152.png', description: 'iOS touch icon' },
  { size: 192, name: 'icon-192x192.png', description: 'Android home screen' },
  { size: 384, name: 'icon-384x384.png', description: 'Splash screen' },
  { size: 512, name: 'icon-512x512.png', description: 'Splash screen alta resolución' }
];

const OUTPUT_DIR = './assets/icons';

/**
 * Crear directorio si no existe
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Directorio creado: ${dirPath}`);
  }
}

/**
 * Generar un icono de tamaño específico usando Canvas
 */
async function generateIcon(image, size, outputPath) {
  try {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Calcular dimensiones manteniendo aspecto
    const aspectRatio = image.width / image.height;
    let drawWidth = size;
    let drawHeight = size;
    let offsetX = 0;
    let offsetY = 0;
    
    if (aspectRatio > 1) {
      // Imagen más ancha que alta
      drawHeight = size / aspectRatio;
      offsetY = (size - drawHeight) / 2;
    } else if (aspectRatio < 1) {
      // Imagen más alta que ancha
      drawWidth = size * aspectRatio;
      offsetX = (size - drawWidth) / 2;
    }
    
    // Dibujar imagen centrada
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    
    // Guardar como PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    return true;
  } catch (error) {
    console.error(`❌ Error generando ${outputPath}:`, error.message);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🎨 PWA Icon Generator (Canvas)');
  console.log('=============================\n');

  // Obtener ruta de imagen base desde argumentos
  const inputImage = process.argv[2];
  
  if (!inputImage) {
    console.error('❌ Error: Debes proporcionar la ruta de la imagen base.');
    console.log('💡 Uso: node generate-icons-canvas.js <ruta-imagen>');
    console.log('📝 Ejemplo: node generate-icons-canvas.js logo.png');
    process.exit(1);
  }

  // Verificar que el archivo existe
  if (!fs.existsSync(inputImage)) {
    console.error(`❌ Error: El archivo "${inputImage}" no existe.`);
    process.exit(1);
  }

  // Crear directorio de salida
  ensureDirectoryExists(OUTPUT_DIR);

  console.log(`📸 Imagen base: ${inputImage}`);
  console.log(`📁 Directorio de salida: ${OUTPUT_DIR}\n`);

  // Cargar imagen base
  console.log('🔄 Cargando imagen base...');
  const image = await loadImage(inputImage);
  console.log(`✅ Imagen cargada: ${image.width}x${image.height}px\n`);

  // Generar todos los iconos
  let successCount = 0;
  let totalCount = ICON_SIZES.length;

  for (const iconConfig of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, iconConfig.name);
    
    console.log(`🔄 Generando ${iconConfig.name} (${iconConfig.size}x${iconConfig.size})...`);
    
    const success = await generateIcon(image, iconConfig.size, outputPath);
    
    if (success) {
      console.log(`✅ ${iconConfig.name} - ${iconConfig.description}`);
      successCount++;
    } else {
      console.log(`❌ Error generando ${iconConfig.name}`);
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`✅ Iconos generados exitosamente: ${successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 ¡Todos los iconos PWA han sido generados correctamente!');
    console.log('📱 Tu aplicación ya está lista para ser instalada como PWA.');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Verifica que los iconos se ven correctos');
    console.log('   2. Prueba la instalación PWA en tu navegador');
    console.log('   3. Testa en diferentes dispositivos');
  } else {
    console.log('\n⚠️  Algunos iconos no se pudieron generar. Revisa los errores arriba.');
  }
}

// Ejecutar script
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});