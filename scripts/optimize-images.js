#!/usr/bin/env node
/**
 * Optimiza cover.png y los iconos del loader a versiones webp/jpeg pequeñas.
 * Reduce ~1MB a ~80KB total.
 *
 * Uso: node scripts/optimize-images.js
 */
const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ sharp no instalado. Ejecuta: pnpm install sharp');
  process.exit(1);
}

const TASKS = [
  {
    input: 'assets/img/cover.png',
    outputs: [
      { file: 'assets/img/cover.webp', format: 'webp', opts: { quality: 72, effort: 5 } },
      { file: 'assets/img/cover-sm.jpg', format: 'jpeg', opts: { quality: 72, width: 720 } }
    ]
  },
  {
    input: 'assets/icons/icon-512x512.png',
    outputs: [
      { file: 'assets/icons/icon-512.webp', format: 'webp', opts: { quality: 80 } },
      { file: 'assets/icons/icon-192.webp', format: 'webp', opts: { quality: 80 } }
    ]
  }
];

async function optimize() {
  for (const task of TASKS) {
    if (!fs.existsSync(task.input)) {
      console.log(`⏭  Skip (no existe): ${task.input}`);
      continue;
    }
    const inputSize = fs.statSync(task.input).size;
    for (const out of task.outputs) {
      try {
        let pipe = sharp(task.input);
        if (out.opts.width) pipe = pipe.resize({ width: out.opts.width, withoutEnlargement: true });
        const data = await pipe[out.format](out.opts).toBuffer();
        fs.writeFileSync(out.file, data);
        const pct = ((1 - data.length / inputSize) * 100).toFixed(1);
        console.log(`✅ ${out.file}  ${(data.length / 1024).toFixed(1)} KB  (-${pct}% vs ${(inputSize / 1024).toFixed(1)} KB)`);
      } catch (e) {
        console.error(`❌ Error optimizando ${out.file}:`, e.message);
      }
    }
  }
}

optimize().catch((e) => { console.error(e); process.exit(1); });