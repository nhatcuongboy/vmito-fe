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

console.log('🔄 Starting key sorting process...\n');

// Function to sort object keys based on reference object
function sortObjectByReference(obj, reference) {
  const sorted = {};

  // First, add all keys that exist in reference, in the same order
  for (const key in reference) {
    if (obj.hasOwnProperty(key)) {
      if (
        typeof reference[key] === 'object' &&
        reference[key] !== null &&
        !Array.isArray(reference[key])
      ) {
        // Recursively sort nested objects
        sorted[key] = sortObjectByReference(obj[key], reference[key]);
      } else {
        sorted[key] = obj[key];
      }
    }
  }

  // Then add any extra keys that don't exist in reference (shouldn't happen after sync)
  for (const key in obj) {
    if (!sorted.hasOwnProperty(key)) {
      sorted[key] = obj[key];
    }
  }

  return sorted;
}

// Sort VI and CN based on EN structure
console.log('📝 Sorting VI keys to match EN order...');
const viSorted = sortObjectByReference(vi, en);

console.log('📝 Sorting CN keys to match EN order...');
const cnSorted = sortObjectByReference(cn, en);

// Write back to files with proper formatting
console.log('\n💾 Writing sorted files...');
fs.writeFileSync(viPath, JSON.stringify(viSorted, null, 2) + '\n', 'utf8');
console.log('   ✅ vi.json sorted');

fs.writeFileSync(cnPath, JSON.stringify(cnSorted, null, 2) + '\n', 'utf8');
console.log('   ✅ cn.json sorted');

console.log(
  '\n✨ Sorting complete! All files now have keys in the same order as en.json\n'
);
