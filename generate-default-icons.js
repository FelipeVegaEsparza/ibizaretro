#!/usr/bin/env node

/**
 * Generador de Iconos PWA por Defecto
 * Crea iconos básicos con texto si no tienes una imagen base
 */

const fs = require('fs');
const path = require('path');

// Verificar si canvas está disponible
let { createCanvas } = {};
try {
  ({ createCanvas } = require('canvas'));
} catch (error) {
  console.error('❌ Error: canvas no está instalado.');
  console.log('📦 Instala canvas ejecutando: npm install canvas');
  process.exit(1);
}

const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
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
 * Generar icono por defecto con texto
 */
function generateDefaultIcon(size, outputPath, text = 'IP') {
  try {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Fondo con gradiente
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#3498db');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Texto centrado
    const fontSize = Math.floor(size * 0.4);
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Sombra del texto
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = Math.floor(size * 0.02);
    ctx.shadowOffsetX = Math.floor(size * 0.01);
    ctx.shadowOffsetY = Math.floor(size * 0.01);
    
    ctx.fillText(text, size / 2, size / 2);
    
    // Borde redondeado (efecto)
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = Math.max(1, Math.floor(size * 0.01));
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, size - ctx.lineWidth, size - ctx.lineWidth);
    
    // Guardar
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
  console.log('🎨 Generador de Iconos PWA por Defecto');
  console.log('====================================\n');

  const text = process.argv[2] || 'IP';
  
  console.log(`📝 Texto del icono: "${text}"`);
  console.log(`📁 Directorio de salida: ${OUTPUT_DIR}\n`);

  // Crear directorio de salida
  ensureDirectoryExists(OUTPUT_DIR);

  // Generar todos los iconos
  let successCount = 0;
  let totalCount = ICON_SIZES.length;

  for (const iconConfig of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, iconConfig.name);
    
    console.log(`🔄 Generando ${iconConfig.name} (${iconConfig.size}x${iconConfig.size})...`);
    
    const success = generateDefaultIcon(iconConfig.size, outputPath, text);
    
    if (success) {
      console.log(`✅ ${iconConfig.name}`);
      successCount++;
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`✅ Iconos generados exitosamente: ${successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 ¡Iconos por defecto generados correctamente!');
    console.log('💡 Puedes reemplazarlos más tarde con tus propios iconos.');
  }
}

// Ejecutar script
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});