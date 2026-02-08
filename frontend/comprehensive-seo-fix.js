const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src', 'pages', 'admin');

// Get all .jsx files in admin directory
const adminFiles = fs.readdirSync(adminDir)
  .filter(file => file.endsWith('.jsx'))
  .map(file => path.join(adminDir, file));

console.log(`Found ${adminFiles.length} admin files to process`);

adminFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, '.jsx');

    // Skip if already has SEOHead
    if (content.includes('SEOHead')) {
      console.log(`Skipping ${fileName} - already has SEO`);
      return;
    }

    // Add SEOHead import
    if (!content.includes("import SEOHead from '../../components/SEO/SEOHead'")) {
      // Find a good place to add the import (after other component imports)
      const importMatch = content.match(/import.*from ['"]\.\.\/\.\.\/components\/common\/.*['"];?\s*$/m);
      if (importMatch) {
        content = content.replace(importMatch[0], importMatch[0] + "\nimport SEOHead from '../../components/SEO/SEOHead';");
      } else {
        // Fallback: add after the last import
        const lastImportMatch = content.match(/import.*from ['"]\.\.\/.*['"];?\s*$/m);
        if (lastImportMatch) {
          content = content.replace(lastImportMatch[0], lastImportMatch[0] + "\nimport SEOHead from '../../components/SEO/SEOHead';");
        }
      }
    }

    // Find the main return statement (not inside functions or conditionals)
    const returnMatch = content.match(/(\s+)return \(\s*\n\s*<div[^>]*>/);
    if (!returnMatch) {
      console.log(`No suitable return statement found in ${fileName}`);
      return;
    }

    const indent = returnMatch[1];

    // Add JSX fragment wrapper and SEOHead
    content = content.replace(
      /(\s+)return \(\s*\n\s*<div([^>]*)>/,
      `$1return (\n$1  <>\n$1  <SEOHead title="${fileName.replace(/([A-Z])/g, ' $1').trim()} - Admin" noIndex={true} noFollow={true} />\n$1  <div$2>`
    );

    // Find the closing of the main return (look for the pattern where ) is followed by } and possibly a semicolon)
    // This is tricky because we need to find the correct closing parenthesis for the main return
    const lines = content.split('\n');
    let openBraces = 0;
    let returnStartLine = -1;
    let returnEndLine = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('return (')) {
        returnStartLine = i;
        break;
      }
    }

    if (returnStartLine === -1) {
      console.log(`Could not find return start in ${fileName}`);
      return;
    }

    // Count braces from return start
    for (let i = returnStartLine; i < lines.length; i++) {
      const line = lines[i];
      for (const char of line) {
        if (char === '(') openBraces++;
        if (char === ')') openBraces--;
      }
      if (openBraces === 0) {
        returnEndLine = i;
        break;
      }
    }

    if (returnEndLine === -1) {
      console.log(`Could not find return end in ${fileName}`);
      return;
    }

    // Add closing fragment before the closing )
    const endLine = lines[returnEndLine];
    if (endLine.includes(')')) {
      lines[returnEndLine] = endLine.replace(/\s*\)\s*$/, '\n  </>\n)');
    }

    content = lines.join('\n');

    fs.writeFileSync(filePath, content);
    console.log(`Successfully updated ${fileName}`);

  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log('SEO addition to admin files completed');
