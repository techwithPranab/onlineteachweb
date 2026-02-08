const fs = require('fs');
const path = require('path');

const files = [
  'QuestionBank.jsx',
  'QuestionImportExport.jsx',
  'RevenueAnalytics.jsx',
  'SessionManagement.jsx'
];

const adminDir = path.join(__dirname, 'src', 'pages', 'admin');

files.forEach(file => {
  const filePath = path.join(adminDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Add SEOHead import
  if (!content.includes("import SEOHead from '../../components/SEO/SEOHead'")) {
    content = content.replace(
      /import.*from '\.\.\/\.\.\/components\/common\/ErrorMessage';\s*$/m,
      "$&import SEOHead from '../../components/SEO/SEOHead';\n"
    );
  }

  // Add JSX fragment wrapper
  content = content.replace(
    /(\s+)return \(\s*\n\s*<div/,
    '$1return (\n$1  <>\n$1  <SEOHead title="' + file.replace('.jsx', '').replace(/([A-Z])/g, ' $1').trim() + ' - Admin" noIndex={true} noFollow={true} />\n$1  <div'
  );

  // Add closing fragment
  content = content.replace(
    /(\s+)(\}\s*\)\s*;?\s*\}\s*$)/m,
    '$1  </>\n$1$2'
  );

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});

console.log('Manual SEO addition completed for remaining admin files');
