#!/usr/bin/env node

/**
 * PWA Icon Generator Script
 * Genera todos los iconos PWA necesarios desde una imagen base
 * 
 * Uso: node generate-icons.js [ruta-imagen-base]
 * Ejemplo: node generate-icons.js logo.png
 */

const fs = require('fs');
const path = require('path');

// Verificar si sharp está disponible
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Error: sharp no está instalado.');
  console.log('📦 Instala sharp ejecutando: npm install sharp');
  console.log('💡 O usa la versión alternativa con canvas: node generate-icons-canvas.js');
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
 * Generar un icono de tamaño específico
 */
async function generateIcon(inputPath, size, outputPath) {
  try {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Fondo transparente
      })
      .png()
      .toFile(outputPath);
    
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
  console.log('🎨 PWA Icon Generator');
  console.log('====================\n');

  // Obtener ruta de imagen base desde argumentos
  const inputImage = process.argv[2];
  
  if (!inputImage) {
    console.error('❌ Error: Debes proporcionar la ruta de la imagen base.');
    console.log('💡 Uso: node generate-icons.js <ruta-imagen>');
    console.log('📝 Ejemplo: node generate-icons.js logo.png');
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

  // Generar todos los iconos
  let successCount = 0;
  let totalCount = ICON_SIZES.length;

  for (const iconConfig of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, iconConfig.name);
    
    console.log(`🔄 Generando ${iconConfig.name} (${iconConfig.size}x${iconConfig.size})...`);
    
    const success = await generateIcon(inputImage, iconConfig.size, outputPath);
    
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