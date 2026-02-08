const fs = require('fs');
const path = require('path');

// List of admin files that need fixing
const adminFiles = [
  'PaymentManagement.jsx',
  'QuestionBank.jsx',
  'QuestionImportExport.jsx',
  'RevenueAnalytics.jsx',
  'SessionManagement.jsx'
];

const adminDir = path.join(__dirname, 'src', 'pages', 'admin');

function fixJSXFragments(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if SEOHead is already imported
    if (!content.includes("import SEOHead from '../../components/SEO/SEOHead'")) {
      // Add SEOHead import after other component imports
      const importPattern = /import.*from '\.\.\/\.\.\/components\/common\/.*';\s*$/m;
      const seoImport = "import SEOHead from '../../components/SEO/SEOHead';\n";
      content = content.replace(importPattern, (match) => match + seoImport);
    }

    // Find the return statement
    const returnMatch = content.match(/(\s+)return \(\s*\n\s*<div/);
    if (!returnMatch) {
      console.log(`No return statement found in ${filePath}`);
      return;
    }

    const indent = returnMatch[1];

    // Replace return ( with return (<>
    content = content.replace(
      /(\s+)return \(\s*\n\s*<div/,
      `$1return (\n$1  <>\n$1  <SEOHead title="${path.basename(filePath, '.jsx').replace(/([A-Z])/g, ' $1').trim()} - Admin" noIndex={true} noFollow={true} />\n$1  <div`
    );

    // Find the closing ) and replace with </>
    // Look for the pattern where ) is followed by } and possibly a semicolon
    const closingPattern = /(\s+)(\}\s*\)\s*;?\s*\}\s*$)/m;
    const closingMatch = content.match(closingPattern);

    if (closingMatch) {
      const beforeClosing = closingMatch[1];
      content = content.replace(
        closingPattern,
        `${beforeClosing}  </>\n${beforeClosing}$2`
      );
    }

    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

adminFiles.forEach(file => {
  const filePath = path.join(adminDir, file);
  if (fs.existsSync(filePath)) {
    fixJSXFragments(filePath);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('JSX fragment fixing completed for remaining admin files');
