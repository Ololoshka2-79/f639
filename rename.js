const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
  { from: /luxury-black/g, to: 'app-bg' },
  { from: /luxury-graphite/g, to: 'app-surface' },
  { from: /luxury-gold/g, to: 'app-accent' },
  { from: /luxury-cream/g, to: 'app-text' },
  { from: /luxury-steel/g, to: 'app-text-muted' },
  { from: /gold-gradient/g, to: 'app-accent-gradient' }
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css') || file.endsWith('.json')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(directoryPath);
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
