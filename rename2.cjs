const fs = require('fs');
const path = require('path');

const replacements = [
  { file: 'src/pages/admin/AnalyticsPage.tsx', rules: [
    { from: /#C9A86A/g, to: 'var(--app-accent)' }
  ]},
  { file: 'src/components/ui/ThemeManager.tsx', rules: [
    { from: /'#0D0D0D'/g, to: "'#000000'" },
    { from: /'#F5F2EC'/g, to: "'#FFFFFF'" }
  ]},
  { file: 'src/App.tsx', rules: [
    { from: /'#0D0D0D'/g, to: "'#000000'" },
    { from: /'#F5F2EC'/g, to: "'#FFFFFF'" }
  ]},
  { file: 'src/components/ui/SplashScreen.tsx', rules: [
    { from: /#C9A86A/g, to: 'var(--app-accent)' }
  ]},
  { file: 'src/components/payment/OrderSuccess.tsx', rules: [
    { from: /bg-app-accent-gradient/g, to: 'bg-app-accent' },
    { from: /shadow-\[0_0_30px_rgba\(201,168,106,0\.5\)\]/g, to: 'shadow-[0_0_30px_var(--app-border)]' }
  ]},
  { file: 'src/components/checkout/DeliveryStep.tsx', rules: [
    { from: /background: #C9A86A/g, to: 'background: var(--app-accent)' }
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
      fs.writeFileSync(filePath, updated);
      console.log(`Updated ${filePath}`);
    }
  }
});
