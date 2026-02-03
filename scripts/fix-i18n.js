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

// Helper to get nested value
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Helper to set nested value
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

// Helper to delete nested key
function deleteNestedKey(obj, path) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => current?.[key], obj);
  if (target) delete target[lastKey];
}

// Get all keys from nested object
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

const enKeys = getAllKeys(en);
const viKeys = getAllKeys(vi);
const cnKeys = getAllKeys(cn);

console.log('🔧 Starting i18n fix process...\n');

// Fix VI file
console.log('📝 Fixing VI translations...');
const missingInVi = enKeys.filter((k) => !viKeys.includes(k));
const extraInVi = viKeys.filter((k) => !enKeys.includes(k));

let viFixed = 0;
missingInVi.forEach((key) => {
  const enValue = getNestedValue(en, key);
  // Try to use English value as placeholder
  setNestedValue(vi, key, enValue);
  viFixed++;
  console.log(`   ✅ Added: ${key}`);
});

extraInVi.forEach((key) => {
  deleteNestedKey(vi, key);
  console.log(`   🗑️  Removed extra: ${key}`);
});

// Fix CN file
console.log('\n📝 Fixing CN translations...');
const missingInCn = enKeys.filter((k) => !cnKeys.includes(k));
const extraInCn = cnKeys.filter((k) => !enKeys.includes(k));

let cnFixed = 0;
missingInCn.forEach((key) => {
  const enValue = getNestedValue(en, key);
  // Try to use English value as placeholder
  setNestedValue(cn, key, enValue);
  cnFixed++;
  console.log(`   ✅ Added: ${key}`);
});

extraInCn.forEach((key) => {
  deleteNestedKey(cn, key);
  console.log(`   🗑️  Removed extra: ${key}`);
});

// Write back to files
fs.writeFileSync(viPath, JSON.stringify(vi, null, 2) + '\n', 'utf8');
fs.writeFileSync(cnPath, JSON.stringify(cn, null, 2) + '\n', 'utf8');

console.log('\n✨ Fix complete!');
console.log(`   VI: ${viFixed} keys added, ${extraInVi.length} keys removed`);
console.log(`   CN: ${cnFixed} keys added, ${extraInCn.length} keys removed\n`);
