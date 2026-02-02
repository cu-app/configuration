/**
 * Branding Replacer - "Rabbit Virus Style" Renaming
 * 
 * Automatically replaces ALL instances of source CU branding (Suncoast, SCU, etc.)
 * with the purchasing CU's branding throughout the entire cloned codebase
 */

export interface BrandingReplacement {
  // Source patterns to find
  source: {
    name: string // "Suncoast Credit Union"
    prefix: string // "SCU"
    initials: string // "SCU" (uppercase)
    lowercase: string // "suncoast"
    domain: string // "suncoastcreditunion.com"
    shortName: string // "Suncoast"
  }
  
  // Target patterns to replace with
  target: {
    name: string // Purchasing CU's full name
    prefix: string // Purchasing CU's prefix (e.g., "NFCU")
    initials: string // Purchasing CU's initials (uppercase)
    lowercase: string // Purchasing CU's name lowercase
    domain: string // Purchasing CU's domain
    shortName: string // Purchasing CU's short name
  }
}

/**
 * Generate branding replacement rules from CU config
 */
export function generateBrandingReplacement(cuConfig: {
  tenant?: {
    name: string
    domain?: string
  }
  poweron?: {
    prefix: string
  }
}): BrandingReplacement {
  const sourceName = "Suncoast Credit Union"
  const sourcePrefix = "SCU"
  const sourceDomain = "suncoastcreditunion.com"
  
  // Extract target CU info
  const targetName = cuConfig.tenant?.name || "Credit Union"
  const targetPrefix = cuConfig.poweron?.prefix || generatePrefixFromName(targetName)
  const targetDomain = cuConfig.tenant?.domain || generateDomainFromName(targetName)
  const targetShortName = extractShortName(targetName)
  
  return {
    source: {
      name: sourceName,
      prefix: sourcePrefix,
      initials: sourcePrefix,
      lowercase: "suncoast",
      domain: sourceDomain,
      shortName: "Suncoast",
    },
    target: {
      name: targetName,
      prefix: targetPrefix,
      initials: targetPrefix.toUpperCase(),
      lowercase: targetName.toLowerCase().replace(/\s+/g, ''),
      domain: targetDomain,
      shortName: targetShortName,
    },
  }
}

/**
 * Generate prefix from CU name
 */
function generatePrefixFromName(name: string): string {
  // Remove common words
  const words = name
    .toUpperCase()
    .replace(/CREDIT UNION|FCU|CU|FEDERAL|THE|&/gi, '')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0)
  
  // Take first letter of each word
  const prefix = words.map(w => w[0]).join('')
  
  // Limit to 5 characters
  return prefix.substring(0, 5) || 'CU'
}

/**
 * Extract short name from full name
 */
function extractShortName(fullName: string): string {
  // Remove "Credit Union", "FCU", etc.
  return fullName
    .replace(/\s+Credit Union.*/i, '')
    .replace(/\s+FCU.*/i, '')
    .replace(/\s+Federal.*/i, '')
    .trim()
}

/**
 * Generate domain from name
 */
function generateDomainFromName(name: string): string {
  const domain = name
    .toLowerCase()
    .replace(/credit union|fcu|cu|federal|the|&/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
  
  return `${domain}.com`
}

/**
 * Get all replacement patterns (case-insensitive variations)
 */
export function getReplacementPatterns(replacement: BrandingReplacement): Array<{
  find: string | RegExp
  replace: string
  description: string
}> {
  const patterns: Array<{ find: string | RegExp; replace: string; description: string }> = []
  
  // Full name replacements
  patterns.push({
    find: new RegExp(replacement.source.name, 'gi'),
    replace: replacement.target.name,
    description: 'Full CU name',
  })
  
  patterns.push({
    find: new RegExp(replacement.source.shortName, 'gi'),
    replace: replacement.target.shortName,
    description: 'Short CU name',
  })
  
  // Prefix replacements (SCU -> NFCU, etc.)
  patterns.push({
    find: new RegExp(`\\b${replacement.source.prefix}\\b`, 'g'),
    replace: replacement.target.prefix,
    description: 'Prefix (word boundary)',
  })
  
  patterns.push({
    find: new RegExp(`${replacement.source.prefix}\\.`, 'g'),
    replace: `${replacement.target.prefix}.`,
    description: 'Prefix with dot (SCU. -> NFCU.)',
  })
  
  patterns.push({
    find: new RegExp(`${replacement.source.prefix}/`, 'g'),
    replace: `${replacement.target.prefix}/`,
    description: 'Prefix with slash (SCU/ -> NFCU/)',
  })
  
  patterns.push({
    find: new RegExp(`${replacement.source.prefix}-`, 'g'),
    replace: `${replacement.target.prefix}-`,
    description: 'Prefix with dash (SCU- -> NFCU-)',
  })
  
  patterns.push({
    find: new RegExp(`_${replacement.source.prefix}`, 'g'),
    replace: `_${replacement.target.prefix}`,
    description: 'Prefix with underscore (_SCU -> _NFCU)',
  })
  
  // Domain replacements
  patterns.push({
    find: new RegExp(replacement.source.domain, 'gi'),
    replace: replacement.target.domain,
    description: 'Domain name',
  })
  
  // Lowercase variations
  patterns.push({
    find: new RegExp(`\\b${replacement.source.lowercase}\\b`, 'gi'),
    replace: replacement.target.lowercase,
    description: 'Lowercase name',
  })
  
  // Namespace/package replacements (C#)
  patterns.push({
    find: new RegExp(`namespace ${replacement.source.prefix}\\.`, 'g'),
    replace: `namespace ${replacement.target.prefix}.`,
    description: 'C# namespace',
  })
  
  patterns.push({
    find: new RegExp(`using ${replacement.source.prefix}\\.`, 'g'),
    replace: `using ${replacement.target.prefix}.`,
    description: 'C# using statement',
  })
  
  // File path replacements
  patterns.push({
    find: new RegExp(`${replacement.source.prefix}/`, 'g'),
    replace: `${replacement.target.prefix}/`,
    description: 'Directory paths',
  })
  
  patterns.push({
    find: new RegExp(`${replacement.source.prefix}\\\\`, 'g'),
    replace: `${replacement.target.prefix}\\\\`,
    description: 'Windows paths',
  })
  
  // PowerOn spec file replacements
  patterns.push({
    find: new RegExp(`${replacement.source.prefix}\\.`, 'g'),
    replace: `${replacement.target.prefix}.`,
    description: 'PowerOn spec names',
  })
  
  // URL/endpoint replacements
  patterns.push({
    find: new RegExp(`/${replacement.source.lowercase}/`, 'gi'),
    replace: `/${replacement.target.lowercase}/`,
    description: 'URL paths',
  })
  
  // Email domain replacements
  patterns.push({
    find: new RegExp(`@${replacement.source.domain}`, 'gi'),
    replace: `@${replacement.target.domain}`,
    description: 'Email domains',
  })
  
  // Comments/documentation
  patterns.push({
    find: /Suncoast/gi,
    replace: replacement.target.shortName,
    description: 'Comment references',
  })
  
  return patterns
}

/**
 * Generate find-and-replace script for branding replacement
 */
export function generateBrandingReplaceScript(
  replacement: BrandingReplacement,
  _targetDir: string = "./feature-clone"
): string {
  const patterns = getReplacementPatterns(replacement)
  
  let script = `#!/bin/bash
# Branding Replacement Script - "Rabbit Virus Style"
# Replaces ALL instances of source branding with target CU branding
# Source: ${replacement.source.name} (${replacement.source.prefix})
# Target: ${replacement.target.name} (${replacement.target.prefix})

set -e

TARGET_DIR="${targetDir}"

if [ ! -d "$TARGET_DIR" ]; then
  echo "❌ Error: Target directory not found: $TARGET_DIR"
  exit 1
fi

echo "🔄 Starting branding replacement..."
echo "📝 Source: ${replacement.source.name} (${replacement.source.prefix})"
echo "📝 Target: ${replacement.target.name} (${replacement.target.prefix})"
echo ""

cd "$TARGET_DIR"

# Counter for replacements
REPLACEMENT_COUNT=0

`
  
  // Add find-and-replace commands for each pattern
  patterns.forEach((pattern, index) => {
    const findEscaped = typeof pattern.find === 'string' 
      ? pattern.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      : pattern.find.source
    
    script += `# ${pattern.description}
echo "  Replacing: ${pattern.description}..."
`
    
    if (typeof pattern.find === 'string') {
      script += `find . -type f \\( -name "*.cs" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.dart" -o -name "*.sql" -o -name "*.json" -o -name "*.xml" -o -name "*.md" -o -name "*.txt" -o -name "*.yaml" -o -name "*.yml" -o -name "*.sh" -o -name "*.bat" -o -name "*.ps1" \\) -exec sed -i '' "s|${findEscaped}|${pattern.replace.replace(/\|/g, '\\|')}|g" {} + 2>/dev/null || true
`
    } else {
      // For regex patterns, use perl for better regex support
      const regexSource = pattern.find.source.replace(/\//g, '\\/')
      const regexFlags = pattern.find.flags
      const replaceEscaped = pattern.replace.replace(/\//g, '\\/').replace(/\$/g, '\\$')
      script += `find . -type f \\( -name "*.cs" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.dart" -o -name "*.sql" -o -name "*.json" -o -name "*.xml" -o -name "*.md" -o -name "*.txt" -o -name "*.yaml" -o -name "*.yml" -o -name "*.sh" -o -name "*.bat" -o -name "*.ps1" \\) -exec perl -i -pe "s/${regexSource}/${replaceEscaped}/g${regexFlags}" {} + 2>/dev/null || true
`
    }
    
    script += `REPLACEMENT_COUNT=$((REPLACEMENT_COUNT + 1))
`
  })
  
  script += `
# Rename files and directories
echo ""
echo "📁 Renaming files and directories..."

# Rename directories containing source prefix
find . -type d -name "*${replacement.source.prefix}*" | while read dir; do
  new_dir=$(echo "$dir" | sed "s/${replacement.source.prefix}/${replacement.target.prefix}/g")
  if [ "$dir" != "$new_dir" ]; then
    mv "$dir" "$new_dir" 2>/dev/null || true
  fi
done

# Rename files containing source prefix
find . -type f -name "*${replacement.source.prefix}*" | while read file; do
  new_file=$(echo "$file" | sed "s/${replacement.source.prefix}/${replacement.target.prefix}/g")
  if [ "$file" != "$new_file" ]; then
    mv "$file" "$new_file" 2>/dev/null || true
  fi
done

# Rename directories containing source name
find . -type d -name "*${replacement.source.lowercase}*" | while read dir; do
  new_dir=$(echo "$dir" | sed "s/${replacement.source.lowercase}/${replacement.target.lowercase}/g")
  if [ "$dir" != "$new_dir" ]; then
    mv "$dir" "$new_dir" 2>/dev/null || true
  fi
done

# Rename files containing source name
find . -type f -name "*${replacement.source.lowercase}*" | while read file; do
  new_file=$(echo "$file" | sed "s/${replacement.source.lowercase}/${replacement.target.lowercase}/g")
  if [ "$file" != "$new_file" ]; then
    mv "$file" "$new_file" 2>/dev/null || true
  fi
done

echo ""
echo "✅ Branding replacement complete!"
echo "📊 Processed $REPLACEMENT_COUNT replacement patterns"
echo "📝 All instances of '${replacement.source.name}' replaced with '${replacement.target.name}'"
echo "📝 All instances of '${replacement.source.prefix}' replaced with '${replacement.target.prefix}'"
echo ""
echo "⚠️  IMPORTANT: Review the changes and test thoroughly!"
echo "   Some manual adjustments may be needed for:"
echo "   - Environment variables"
echo "   - Configuration files"
echo "   - Database connection strings"
echo "   - API endpoints"
`
  
  return script
}

/**
 * Generate comprehensive replacement report
 */
export function generateReplacementReport(replacement: BrandingReplacement): string {
  const patterns = getReplacementPatterns(replacement)
  
  return `# Branding Replacement Report

## Source Branding
- **Name:** ${replacement.source.name}
- **Prefix:** ${replacement.source.prefix}
- **Short Name:** ${replacement.source.shortName}
- **Domain:** ${replacement.source.domain}

## Target Branding
- **Name:** ${replacement.target.name}
- **Prefix:** ${replacement.target.prefix}
- **Short Name:** ${replacement.target.shortName}
- **Domain:** ${replacement.target.domain}

## Replacement Patterns (${patterns.length} total)

${patterns.map((p, i) => `${i + 1}. **${p.description}**
   - Find: \`${typeof p.find === 'string' ? p.find : p.find.source}\`
   - Replace: \`${p.replace}\`
`).join('\n')}

## Files Affected

The replacement will process all files with these extensions:
- Code: \`.cs\`, \`.ts\`, \`.tsx\`, \`.js\`, \`.jsx\`, \`.dart\`
- Config: \`.json\`, \`.xml\`, \`.yaml\`, \`.yml\`
- Database: \`.sql\`
- Docs: \`.md\`, \`.txt\`
- Scripts: \`.sh\`, \`.bat\`, \`.ps1\`

## Directory Renaming

Directories and files containing source branding will be renamed:
- \`${replacement.source.prefix}/\` → \`${replacement.target.prefix}/\`
- \`${replacement.source.lowercase}/\` → \`${replacement.target.lowercase}/\`

## Manual Review Required

After replacement, manually review:
1. Environment variable files (\`.env\`, \`.env.local\`)
2. Configuration files (\`appsettings.json\`, \`config.json\`)
3. Database connection strings
4. API endpoint URLs
5. Docker compose files
6. CI/CD pipeline configs
`
}
