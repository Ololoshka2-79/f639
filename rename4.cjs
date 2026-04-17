const fs = require('fs');
const path = require('path');

const replacements = [
  // App.tsx and ThemeManager.tsx header colors
  { file: 'src/components/ui/ThemeManager.tsx', rules: [
    { from: /'#000000'/g, to: "'#0A0A0A'" }
  ]},
  { file: 'src/App.tsx', rules: [
    { from: /'#000000'/g, to: "'#0A0A0A'" }
  ]},
  // HomeScreen.tsx search input
  { file: 'src/features/HomeScreen.tsx', rules: [
    { from: /text-app-bg placeholder:text-app-bg\/50 focus:border-app-border-strong focus:bg-app-surface-3 focus:bg-white/g, to: 'text-app-text placeholder:text-app-text-muted focus:border-app-border-strong focus:bg-app-surface-3' },
    { from: /bg-app-surface-1\/[0-9]+/g, to: 'bg-app-surface-1' },
    { from: /flex-[1|0] flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all bg-app-[a-z\-0-9]+/g, to: 'flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all bg-app-surface-2 text-app-text' } // Wait, category chips in CatalogPage
  ]},
  // CatalogPage.tsx Tab chips
  { file: 'src/pages/CatalogPage.tsx', rules: [
    { from: /`whitespace-nowrap px-5 py-2.5 rounded-full text-\[10px].*`/g, to: "`whitespace-nowrap px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${selectedCategory === category.id ? 'bg-app-accent text-app-bg' : 'bg-app-surface-2 text-app-text hover:bg-app-surface-hover'}`" }
  ]},
  // ProductPage.tsx (chips / badges might also need surface-2)
  { file: 'src/pages/ProductPage.tsx', rules: [
    { from: /bg-app-surface-1/g, to: 'bg-app-surface-2' } // Use surface 2 for elements inside ProductPage mostly
  ]},
  // BottomNav.tsx
  { file: 'src/components/ui/BottomNav.tsx', rules: [
    { from: /bg-app-surface-1\/95/g, to: 'bg-black/95 dark:bg-[#0A0A0A]/95' }, // "#0A0A0A" as specifically requested, but responsive. Wait, let's just use CSS vars.
    { from: /bg-app-surface-1/g, to: 'bg-app-surface-1' }
  ]}
];

replacements.forEach(entry => {
  const filePath = path.join(__dirname, entry.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = content;
    entry.rules.forEach(rule => {
      updated = updated.replace(rule.from, rule.to);
    });
    if (updated !== content) {
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`Updated ${entry.file}`);
    }
  }
});
