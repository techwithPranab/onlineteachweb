const fs = require('fs');
const path = require('path');

// Protected pages that need noindex/nofollow
const protectedDirs = [
  { dir: 'src/pages/admin', title: 'Admin' },
  { dir: 'src/pages/student', title: 'Student' },
  { dir: 'src/pages/tutor', title: 'Tutor' }
];

function addSEOToFile(filePath, pageTitle) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, '.jsx');

    // Skip if already has SEOHead
    if (content.includes('import SEOHead from')) {
      console.log(`✓ Skipped ${fileName} - already has SEO`);
      return { skipped: true, reason: 'already has SEO' };
    }

    // Add SEOHead import after other component imports
    const importPatterns = [
      /import.*from ['"]@\/components\/common\/.*['"];?\s*$/m,
      /import.*from ['"]\.\.\/\.\.\/components\/common\/.*['"];?\s*$/m,
      /import.*from ['"].*components\/common\/.*['"];?\s*$/m
    ];

    let importAdded = false;
    for (const pattern of importPatterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, (match) => {
          importAdded = true;
          return match + "\nimport SEOHead from '../../components/SEO/SEOHead';";
        });
        break;
      }
    }

    // Fallback: add after the last import if no common component import found
    if (!importAdded) {
      const lastImportMatch = content.match(/import.*from ['"].*['"];?\s*\n(?!import)/);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[0];
        content = content.replace(lastImport, lastImport + "import SEOHead from '../../components/SEO/SEOHead';\n");
        importAdded = true;
      }
    }

    if (!importAdded) {
      console.log(`✗ Failed ${fileName} - couldn't find import location`);
      return { skipped: true, reason: 'no import location' };
    }

    // Find the main component's return statement
    const exportMatch = content.match(/export default function (\w+)/);
    if (!exportMatch) {
      console.log(`✗ Failed ${fileName} - couldn't find export default function`);
      return { skipped: true, reason: 'no export function' };
    }

    const componentName = exportMatch[1];

    // Find the return statement for the main component
    const returnPattern = new RegExp(`function ${componentName}[^{]*{[\\s\\S]*?\\n(\\s+)return \\(\\s*\\n\\s*<(\\w+|>)`, 'm');
    const returnMatch = content.match(returnPattern);

    if (!returnMatch) {
      console.log(`✗ Failed ${fileName} - couldn't find return statement`);
      return { skipped: true, reason: 'no return statement' };
    }

    const indent = returnMatch[1];
    const firstElement = returnMatch[2];

    // Generate page title from filename
    const readableTitle = fileName
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\s+/g, ' ');

    // Add fragment wrapper and SEOHead
    if (firstElement === '>') {
      // Already has a fragment, just add SEOHead after it
      content = content.replace(
        /(\s+return \(\s*\n\s*<>\s*\n)/,
        `$1${indent}  <SEOHead title="${readableTitle} - ${pageTitle}" noIndex={true} noFollow={true} />\n`
      );
    } else {
      // Wrap in fragment and add SEOHead
      content = content.replace(
        new RegExp(`(\\s+return \\(\\s*\\n\\s*)<${firstElement}([^>]*)>`, 'm'),
        `$1<>\n${indent}  <SEOHead title="${readableTitle} - ${pageTitle}" noIndex={true} noFollow={true} />\n${indent}  <${firstElement}$2>`
      );

      // Find the closing tag and add fragment close
      // This is tricky - we need to find the matching closing tag for the component's return
      // We'll add the closing fragment before the final )
      const lines = content.split('\n');
      let bracketCount = 0;
      let returnFound = false;
      let returnLine = -1;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`function ${componentName}`)) {
          returnFound = false;
        }
        if (returnFound && lines[i].includes('return (')) {
          returnLine = i;
          bracketCount = 0;
        }
        if (returnLine >= 0) {
          for (const char of lines[i]) {
            if (char === '(') bracketCount++;
            if (char === ')') bracketCount--;
          }
          if (bracketCount === 0 && i > returnLine) {
            // Found the closing ) for return
            // Add </> before the closing )
            const beforeParen = lines[i].substring(0, lines[i].lastIndexOf(')'));
            const afterParen = lines[i].substring(lines[i].lastIndexOf(')'));
            lines[i] = beforeParen + '\n' + indent + '  </>' + afterParen;
            break;
          }
        }
        if (lines[i].match(new RegExp(`function ${componentName}`))) {
          returnFound = true;
        }
      }

      content = lines.join('\n');
    }

    fs.writeFileSync(filePath, content);
    console.log(`✓ Updated ${fileName}`);
    return { success: true };

  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return { error: error.message };
  }
}

function processDirectory(dirPath, titlePrefix) {
  const dir = path.join(__dirname, dirPath);
  
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return { processed: 0, skipped: 0, errors: 0 };
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
  let stats = { processed: 0, skipped: 0, errors: 0 };

  console.log(`\n📁 Processing ${dirPath} (${files.length} files)...`);

  files.forEach(file => {
    const result = addSEOToFile(path.join(dir, file), titlePrefix);
    if (result.success) stats.processed++;
    else if (result.skipped) stats.skipped++;
    else if (result.error) stats.errors++;
  });

  return stats;
}

console.log('🚀 Starting Phase 2: Adding SEO to Protected Pages\n');
console.log('=' .repeat(60));

let totalStats = { processed: 0, skipped: 0, errors: 0 };

protectedDirs.forEach(({ dir, title }) => {
  const stats = processDirectory(dir, title);
  totalStats.processed += stats.processed;
  totalStats.skipped += stats.skipped;
  totalStats.errors += stats.errors;
});

console.log('\n' + '='.repeat(60));
console.log('\n📊 Summary:');
console.log(`✓ Successfully processed: ${totalStats.processed}`);
console.log(`⊘ Skipped: ${totalStats.skipped}`);
console.log(`✗ Errors: ${totalStats.errors}`);
console.log(`\n✅ Phase 2 Complete!\n`);
