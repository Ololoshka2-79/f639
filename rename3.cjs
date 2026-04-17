const fs = require('fs');
const path = require('path');

const replacements = [
  // Generic surface replacement
  { from: /bg-app-surface/g, to: 'bg-app-surface-1' },
  { from: /bg-app-surface-1\/30/g, to: 'bg-app-surface-1' },
  { from: /bg-app-surface-1-1/g, to: 'bg-app-surface-1' }, // Safety
  { from: /bg-app-surface-1-2/g, to: 'bg-app-surface-2' }, // Safety
  { from: /bg-app-surface-1\/[0-9]+/g, to: 'bg-app-surface-1' },

  // Inputs / Search
  { from: /bg-white\/90/g, to: 'bg-app-surface-2' },
  { from: /text-luxury-black/g, to: 'text-app-text' },
  { from: /placeholder:text-luxury-black\/50/g, to: 'placeholder:text-app-text-muted' },
  { from: /focus:border-app-accent/g, to: 'focus:border-app-border-strong focus:bg-app-surface-3' },

  // Borders
  { from: /border-white\/5/g, to: 'border-app-border' },
  { from: /border-white\/10/g, to: 'border-app-border-strong' },

  // Header / Bottom Nav
  { from: /bg-app-bg\/90/g, to: 'bg-app-surface-1/95' }, // Make navbar surface-1
  { from: /backdrop-blur-[a-z]+/g, to: 'backdrop-blur-md' }
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  replacements.forEach(r => {
    newContent = newContent.replace(r.from, r.to);
  });
  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});
