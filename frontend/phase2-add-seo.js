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

    // Step 1: Add SEOHead import
    const importPatterns = [
      { pattern: /import.*from ['"]@\/components\/common\/.*['"];?\s*$/m, path: "@/components/SEO/SEOHead" },
      { pattern: /import.*from ['"]\.\.\/\.\.\/components\/common\/.*['"];?\s*$/m, path: "../../components/SEO/SEOHead" },
      { pattern: /import.*from ['"].*components\/common\/.*['"];?\s*$/m, path: "../../components/SEO/SEOHead" }
    ];

    let importAdded = false;
    for (const { pattern, path: importPath } of importPatterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, (match) => {
          importAdded = true;
          return match + `\nimport SEOHead from '${importPath}';`;
        });
        break;
      }
    }

    if (!importAdded) {
      console.log(`✗ Failed ${fileName} - couldn't add import`);
      return { skipped: true, reason: 'no import location' };
    }

    // Step 2: Find the main component's export and return statement
    const exportMatch = content.match(/export default function (\w+)/);
    if (!exportMatch) {
      console.log(`✗ Failed ${fileName} - no export default function`);
      return { skipped: true, reason: 'no export function' };
    }

    const componentName = exportMatch[1];

    // Generate page title from filename
    const readableTitle = fileName
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\s+/g, ' ');

    // Step 3: Add SEOHead at the beginning of the component's return
    // Match the return statement and the opening tag/fragment
    const returnRegex = new RegExp(
      `(export default )?function ${componentName}[^{]*{[\\s\\S]*?\\n(\\s+)return \\(\\s*\\n\\s*(<(?:>|\\w+))`,
      'm'
    );
    
    const returnMatch = content.match(returnRegex);
    if (!returnMatch) {
      console.log(`✗ Failed ${fileName} - couldn't find return statement`);
      return { skipped: true, reason: 'no return statement' };
    }

    const indent = returnMatch[2];
    const openingTag = returnMatch[3];

    if (openingTag === '<>') {
      // Already has a fragment, just add SEOHead after it
      content = content.replace(
        new RegExp(`(function ${componentName}[^{]*{[\\s\\S]*?\\n\\s+return \\(\\s*\\n\\s*<>\\s*\\n)`, 'm'),
        `$1${indent}  <SEOHead title="${readableTitle} - ${pageTitle}" noIndex={true} noFollow={true} />\n`
      );
    } else {
      // Need to wrap in fragment
      content = content.replace(
        new RegExp(`(function ${componentName}[^{]*{[\\s\\S]*?\\n)(\\s+)(return \\(\\s*\\n\\s*)(<\\w+)`, 'm'),
        `$1$2$3<>\n$2  <SEOHead title="${readableTitle} - ${pageTitle}" noIndex={true} noFollow={true} />\n$2  $4`
      );

      // Now find the closing ) of the return statement and add </> before it
      // We need to match balanced parentheses from the return statement
      const lines = content.split('\n');
      let inTargetFunction = false;
      let inReturn = false;
      let parenCount = 0;
      let returnStartLine = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if we're entering the target function
        if (line.match(new RegExp(`function ${componentName}`))) {
          inTargetFunction = true;
          continue;
        }

        // Check if we hit another function definition (means we left our target function)
        if (inTargetFunction && line.match(/^\s*function \w+/) && !line.match(new RegExp(componentName))) {
          break;
        }

        // Look for return statement in our target function
        if (inTargetFunction && line.includes('return (')) {
          inReturn = true;
          returnStartLine = i;
          parenCount = 0;
        }

        // Count parentheses when in return statement
        if (inReturn) {
          for (const char of line) {
            if (char === '(') parenCount++;
            if (char === ')') parenCount--;
          }

          // When parentheses balance, we found the end of return statement
          if (parenCount === 0 && i > returnStartLine) {
            // Add </> before the closing )
            const closingParenIndex = line.lastIndexOf(')');
            if (closingParenIndex !== -1) {
              const before = line.substring(0, closingParenIndex);
              const after = line.substring(closingParenIndex);
              lines[i] = before.trimEnd() + '\n' + indent + '  </>' + after;
            }
            break;
          }
        }
      }

      content = lines.join('\n');
    }

    fs.writeFileSync(filePath, content);
    console.log(`✓ Updated ${fileName}`);
    return { success: true };

  } catch (error) {
    console.error(`✗ Error ${path.basename(filePath)}:`, error.message);
    return { error: error.message };
  }
}

function processDirectory(dirPath, titlePrefix) {
  const dir = path.join(__dirname, dirPath);
  
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return { processed: 0, skipped: 0, errors: 0 };
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx') && f !== 'QuizSetup_Fixed.jsx');
  let stats = { processed: 0, skipped: 0, errors: 0 };

  console.log(`\n📁 ${titlePrefix} Dashboard (${files.length} files)`);

  files.forEach(file => {
    const result = addSEOToFile(path.join(dir, file), titlePrefix);
    if (result.success) stats.processed++;
    else if (result.skipped) stats.skipped++;
    else if (result.error) stats.errors++;
  });

  return stats;
}

console.log('\n🚀 Phase 2: Adding SEO to Protected Pages');
console.log('='.repeat(60));

let totalStats = { processed: 0, skipped: 0, errors: 0 };

protectedDirs.forEach(({ dir, title }) => {
  const stats = processDirectory(dir, title);
  totalStats.processed += stats.processed;
  totalStats.skipped += stats.skipped;
  totalStats.errors += stats.errors;
});

console.log('\n' + '='.repeat(60));
console.log(`\n✓ Processed: ${totalStats.processed} | ⊘ Skipped: ${totalStats.skipped} | ✗ Errors: ${totalStats.errors}`);
console.log(`\n✅ Phase 2 Complete - All protected pages now have noindex/nofollow!\n`);
