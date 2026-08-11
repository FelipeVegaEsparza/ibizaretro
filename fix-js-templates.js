// Script para agregar script del video player a todos los templates
const fs = require('fs');
const path = require('path');

const templates = [
  'blue', 'burbujas', 'carmesi', 'clasico', 'coffee', 'cyberpunk', 
  'dark', 'esmeralda', 'indigo', 'magazine', 'magenta', 'minimalista',
  'oceano', 'petroleo', 'playlist', 'purpura', 'sobrio', 'sunset', 'turquesa'
];

console.log('📜 Adding video-player.js script to all templates...\n');

templates.forEach(templateName => {
  const htmlPath = path.join(__dirname, 'templates', templateName, 'index.html');
  
  if (!fs.existsSync(htmlPath)) {
    console.log(`❌ HTML not found: ${templateName}`);
    return;
  }

  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Skip if already has video-player.js
  if (html.includes('/assets/js/video-player.js')) {
    console.log(`✅ ${templateName} - Already has video-player.js`);
    return;
  }

  // Try different patterns to add the script
  const patterns = [
    // Pattern 1: After onesignal-init.js
    {
      search: /(<script type="module" src="\/assets\/js\/onesignal-init\.js"><\/script>)/,
      replace: '$1\n  <script type="module" src="/assets/js/video-player.js"></script>'
    },
    // Pattern 2: Before main.js
    {
      search: /(<script type="module" src="assets\/js\/main\.js"><\/script>)/,
      replace: '  <script type="module" src="/assets/js/video-player.js"></script>\n  $1'
    },
    // Pattern 3: After promotion-popup.js
    {
      search: /(<script src="\/assets\/js\/promotion-popup\.js"><\/script>)/,
      replace: '$1\n  <script type="module" src="/assets/js/video-player.js"></script>'
    }
  ];

  let updated = false;
  for (const pattern of patterns) {
    if (pattern.search.test(html)) {
      html = html.replace(pattern.search, pattern.replace);
      updated = true;
      break;
    }
  }

  if (updated) {
    fs.writeFileSync(htmlPath, html);
    console.log(`✅ ${templateName} - Added video-player.js`);
  } else {
    console.log(`⚠️  ${templateName} - Could not find suitable pattern to add script`);
  }
});

console.log('\n📜 JavaScript update completed!');