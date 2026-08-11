// Script para agregar toggle de Radio/TV a todos los templates
const fs = require('fs');
const path = require('path');

const templates = [
  'blue', 'burbujas', 'carmesi', 'clasico', 'coffee', 'cyberpunk', 
  'dark', 'esmeralda', 'indigo', 'magazine', 'magenta', 'minimalista',
  'oceano', 'petroleo', 'purpura', 'sobrio', 'sunset', 'turquesa'
];

const toggleHTML = `    <!-- Media Toggle -->
    <div class="section-toggle" id="media-toggle" style="display: none;">
      <button class="toggle-btn active" data-mode="radio">
        <i class="fas fa-radio"></i>
        <span>Radio</span>
      </button>
      <button class="toggle-btn" data-mode="tv">
        <i class="fas fa-tv"></i>
        <span>TV Online</span>
      </button>
    </div>

`;

const tvPlayerHTML = `
    <!-- TV Player -->
    <div class="tv-player" id="tv-player" style="display: none;">
      <div id="tv-player-container">
        <!-- TV Player will be injected here -->
      </div>
    </div>
`;

console.log('🔄 Adding Radio/TV toggle to all templates...\n');

templates.forEach(templateName => {
  const htmlPath = path.join(__dirname, 'templates', templateName, 'index.html');
  
  if (!fs.existsSync(htmlPath)) {
    console.log(`❌ HTML not found: ${templateName}`);
    return;
  }

  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Skip if already has media-toggle
  if (html.includes('media-toggle')) {
    console.log(`✅ ${templateName} - Already has media toggle`);
    return;
  }

  let updated = false;

  // 1. Add toggle before main player container
  const togglePatterns = [
    // Pattern 1: Before main-player
    {
      search: /(\s*<!-- Main Player -->|\s*<div class="main-player")/,
      replace: `${toggleHTML}$1`
    },
    // Pattern 2: Before player-container
    {
      search: /(\s*<div class="player-container")/,
      replace: `${toggleHTML}$1`
    },
    // Pattern 3: Before radio-player
    {
      search: /(\s*<div class="radio-player")/,
      replace: `${toggleHTML}$1`
    }
  ];

  for (const pattern of togglePatterns) {
    if (pattern.search.test(html) && !updated) {
      html = html.replace(pattern.search, pattern.replace);
      updated = true;
      break;
    }
  }

  // 2. Add ID to main player container
  if (!html.includes('id="radio-player"')) {
    html = html.replace(
      /<div class="main-player">/,
      '<div class="main-player" id="radio-player">'
    );
    html = html.replace(
      /<div class="player-container">/,
      '<div class="player-container" id="radio-player">'
    );
  }

  // 3. Add TV player container before footer
  if (!html.includes('tv-player-container')) {
    const footerPatterns = [
      /(\s*<!-- Footer -->)/,
      /(\s*<footer)/,
      /(\s*<\/div>\s*<\/div>\s*<\/body>)/
    ];

    for (const pattern of footerPatterns) {
      if (pattern.test(html)) {
        html = html.replace(pattern, `${tvPlayerHTML}\n$1`);
        break;
      }
    }
  }

  if (updated) {
    fs.writeFileSync(htmlPath, html);
    console.log(`✅ ${templateName} - Added media toggle and TV container`);
  } else {
    console.log(`⚠️  ${templateName} - Could not find suitable pattern for toggle`);
  }
});

console.log('\n🔄 Toggle update completed!');