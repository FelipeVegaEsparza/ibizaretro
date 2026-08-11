// Script para agregar CSS del video player a todos los templates
const fs = require('fs');
const path = require('path');

const templates = [
  'blue', 'burbujas', 'carmesi', 'clasico', 'coffee', 'cyberpunk', 
  'dark', 'esmeralda', 'indigo', 'magazine', 'magenta', 'minimalista',
  'oceano', 'petroleo', 'playlist', 'purpura', 'sobrio', 'sunset', 'turquesa'
];

console.log('🎨 Adding video-player.css to all templates...\n');

templates.forEach(templateName => {
  const htmlPath = path.join(__dirname, 'templates', templateName, 'index.html');
  
  if (!fs.existsSync(htmlPath)) {
    console.log(`❌ HTML not found: ${templateName}`);
    return;
  }

  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Skip if already has video-player.css
  if (html.includes('/assets/css/video-player.css')) {
    console.log(`✅ ${templateName} - Already has video-player.css`);
    return;
  }

  // Try different patterns to add the CSS
  const patterns = [
    // Pattern 1: After promotion-popup.css
    {
      search: /(<link rel="stylesheet" href="\/assets\/css\/promotion-popup\.css">)/,
      replace: '$1\n  <link rel="stylesheet" href="/assets/css/video-player.css">'
    },
    // Pattern 2: After notification-button.css
    {
      search: /(<link rel="stylesheet" href="\/assets\/css\/notification-button\.css">)/,
      replace: '$1\n  <link rel="stylesheet" href="/assets/css/video-player.css">'
    },
    // Pattern 3: After pwa-installer.css
    {
      search: /(<link rel="stylesheet" href="\/assets\/css\/pwa-installer\.css">)/,
      replace: '$1\n  <link rel="stylesheet" href="/assets/css/video-player.css">'
    },
    // Pattern 4: After loading-styles.css
    {
      search: /(<link rel="stylesheet" href="\/assets\/css\/loading-styles\.css">)/,
      replace: '$1\n  <link rel="stylesheet" href="/assets/css/video-player.css">'
    },
    // Pattern 5: After style.css
    {
      search: /(<link rel="stylesheet" href="assets\/css\/style\.css">)/,
      replace: '$1\n  <link rel="stylesheet" href="/assets/css/video-player.css">'
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
    console.log(`✅ ${templateName} - Added video-player.css`);
  } else {
    console.log(`⚠️  ${templateName} - Could not find suitable pattern to add CSS`);
  }
});

console.log('\n🎨 CSS update completed!');