const fs = require('fs');
const path = require('path');

const replacements = [
  // 3. Back buttons standardization (w-10 h-10 flex items-center justify-center)
  { file: 'src/pages/ProductPage.tsx', rules: [
    { from: /p-3 rounded-full bg-black\/40 backdrop-blur-md text-white pointer-events-auto/g, to: 'w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white pointer-events-auto' },
    // Also share/heart/trash buttons in top nav?
    { from: /p-3 rounded-full bg-black\/40 backdrop-blur-md active:scale-90/g, to: 'w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full bg-black/40 backdrop-blur-md active:scale-90' },
    { from: /p-3 rounded-full bg-red-500\/20 backdrop-blur-md text-red-500/g, to: 'w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 backdrop-blur-md text-red-500' }
  ]},
  { file: 'src/pages/ProfilePage.tsx', rules: [
    { from: /p-4 rounded-full bg-black\/50 border border-app-border-strong text-white/g, to: 'w-10 h-10 flex items-center justify-center rounded-full bg-app-surface-1 border border-app-border-strong text-app-text' },
    // 4. Settings toggle contrast
    { from: /bg-white\/10'/g, to: "bg-app-surface-3 border border-app-border-strong'" },
    { from: /bg-white/g, to: 'bg-app-bg' }, // wait, only inside toggle!
    // I can do a safer replacement for profile toggle
    { from: /bg-white transition-all \${notificationsEnabled \? 'right-1' : 'left-1'}/g, to: 'bg-app-bg transition-all ${notificationsEnabled ? "right-1" : "left-1"}' }
  ]},
  { file: 'src/pages/PaymentPage.tsx', rules: [
    { from: /p-3 rounded-full bg-app-surface-1 border border-app-border text-app-accent/g, to: 'w-10 h-10 flex items-center justify-center rounded-full bg-app-surface-1 border border-app-border-strong text-app-text hover:bg-app-surface-hover' }
  ]},
  { file: 'src/pages/admin/AnalyticsPage.tsx', rules: [
    { from: /p-2 -ml-2 rounded-xl text-app-accent hover:bg-app-surface-2/g, to: 'w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full text-app-accent hover:bg-app-surface-2' }
  ]},
  { file: 'src/features/PaymentScreen.tsx', rules: [
    { from: /p-3 rounded-full border border-app-border text-white hover:bg-white\/5/g, to: 'w-10 h-10 flex items-center justify-center rounded-full border border-app-border-strong text-app-text bg-app-surface-1 hover:bg-app-surface-hover' }
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
      console.log(`Updated ${filePath}`);
    }
  }
});
