#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Radio PWA Templates...');
console.log('📁 Directorio:', __dirname);
console.log('🔧 Node.js:', process.version);
console.log('🌐 Puerto:', process.env.PORT || 3000);

// Verificar que server.js existe
const serverPath = path.join(__dirname, 'server.js');
const fs = require('fs');

if (!fs.existsSync(serverPath)) {
  console.error('❌ Error: server.js no encontrado');
  process.exit(1);
}

// Iniciar servidor
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

server.on('error', (err) => {
  console.error('❌ Error al iniciar servidor:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`🛑 Servidor cerrado con código: ${code}`);
  process.exit(code);
});

// Manejo de señales
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando...');
  server.kill('SIGINT');
});