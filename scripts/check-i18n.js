import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const messagesDir = path.join(__dirname, '../src/i18n/messages');

// Read all translation files
const enPath = path.join(messagesDir, 'en.json');
const viPath = path.join(messagesDir, 'vi.json');
const cnPath = path.join(messagesDir, 'cn.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const cn = JSON.parse(fs.readFileSync(cnPath, 'utf8'));

// Function to get all keys from nested object
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (
      typeof obj[key] === 'object' &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Function to check for duplicate keys
function findDuplicates(obj, prefix = '', seen = new Map()) {
  const duplicates = [];

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (
      typeof obj[key] === 'object' &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      duplicates.push(...findDuplicates(obj[key], fullKey, seen));
    } else {
      if (seen.has(fullKey)) {
        duplicates.push({
          key: fullKey,
          locations: [seen.get(fullKey), fullKey],
        });
      } else {
        seen.set(fullKey, fullKey);
      }
    }
  }

  return duplicates;
}

// Get all keys from each file
const enKeys = getAllKeys(en);
const viKeys = getAllKeys(vi);
const cnKeys = getAllKeys(cn);

console.log('\n========================================');
console.log('📊 Translation Files Comparison Report');
console.log('========================================\n');

console.log(`📈 Statistics:`);
console.log(`   EN: ${enKeys.length} keys`);
console.log(`   VI: ${viKeys.length} keys`);
console.log(`   CN: ${cnKeys.length} keys\n`);

// Find missing keys
const missingInVi = enKeys.filter((k) => !viKeys.includes(k));
const missingInCn = enKeys.filter((k) => !cnKeys.includes(k));
const extraInVi = viKeys.filter((k) => !enKeys.includes(k));
const extraInCn = cnKeys.filter((k) => !enKeys.includes(k));

// Check for duplicates
const enDuplicates = findDuplicates(en);
const viDuplicates = findDuplicates(vi);
const cnDuplicates = findDuplicates(cn);

let hasIssues = false;

// Report missing keys in VI
if (missingInVi.length > 0) {
  hasIssues = true;
  console.log(`❌ Missing in VI (${missingInVi.length} keys):`);
  missingInVi.forEach((key) => console.log(`   - ${key}`));
  console.log('');
}

// Report missing keys in CN
if (missingInCn.length > 0) {
  hasIssues = true;
  console.log(`❌ Missing in CN (${missingInCn.length} keys):`);
  missingInCn.forEach((key) => console.log(`   - ${key}`));
  console.log('');
}

// Report extra keys in VI
if (extraInVi.length > 0) {
  hasIssues = true;
  console.log(`⚠️  Extra keys in VI not in EN (${extraInVi.length} keys):`);
  extraInVi.forEach((key) => console.log(`   - ${key}`));
  console.log('');
}

// Report extra keys in CN
if (extraInCn.length > 0) {
  hasIssues = true;
  console.log(`⚠️  Extra keys in CN not in EN (${extraInCn.length} keys):`);
  extraInCn.forEach((key) => console.log(`   - ${key}`));
  console.log('');
}

// Report duplicates
if (enDuplicates.length > 0) {
  hasIssues = true;
  console.log(`🔁 Duplicate keys in EN (${enDuplicates.length}):`);
  enDuplicates.forEach((dup) => console.log(`   - ${dup.key}`));
  console.log('');
}

if (viDuplicates.length > 0) {
  hasIssues = true;
  console.log(`🔁 Duplicate keys in VI (${viDuplicates.length}):`);
  viDuplicates.forEach((dup) => console.log(`   - ${dup.key}`));
  console.log('');
}

if (cnDuplicates.length > 0) {
  hasIssues = true;
  console.log(`🔁 Duplicate keys in CN (${cnDuplicates.length}):`);
  cnDuplicates.forEach((dup) => console.log(`   - ${dup.key}`));
  console.log('');
}

if (!hasIssues) {
  console.log('✅ All translation files are synchronized!\n');
} else {
  console.log('========================================\n');
  process.exit(1);
}
