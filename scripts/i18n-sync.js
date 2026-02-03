#!/usr/bin/env node

/**
 * i18n Synchronization Tool
 *
 * This script performs comprehensive i18n file synchronization:
 * 1. Checks for missing/extra keys
 * 2. Removes empty objects
 * 3. Sorts keys to match EN order
 * 4. Verifies final synchronization
 */

import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const messagesDir = path.join(__dirname, '../src/i18n/messages');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function readFiles() {
  const en = JSON.parse(
    fs.readFileSync(path.join(messagesDir, 'en.json'), 'utf8')
  );
  const vi = JSON.parse(
    fs.readFileSync(path.join(messagesDir, 'vi.json'), 'utf8')
  );
  const cn = JSON.parse(
    fs.readFileSync(path.join(messagesDir, 'cn.json'), 'utf8')
  );
  return { en, vi, cn };
}

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

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

function deleteNestedKey(obj, path) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => current?.[key], obj);
  if (target) delete target[lastKey];
}

function findEmptyObjects(obj, path = '') {
  const empty = [];
  for (const key in obj) {
    const fullPath = path ? `${path}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (Object.keys(obj[key]).length === 0) {
        empty.push(fullPath);
      } else {
        empty.push(...findEmptyObjects(obj[key], fullPath));
      }
    }
  }
  return empty;
}

function sortObjectByReference(obj, reference) {
  const sorted = {};
  for (const key in reference) {
    if (obj.hasOwnProperty(key)) {
      if (
        typeof reference[key] === 'object' &&
        reference[key] !== null &&
        !Array.isArray(reference[key])
      ) {
        sorted[key] = sortObjectByReference(obj[key], reference[key]);
      } else {
        sorted[key] = obj[key];
      }
    }
  }
  for (const key in obj) {
    if (!sorted.hasOwnProperty(key)) {
      sorted[key] = obj[key];
    }
  }
  return sorted;
}

function main() {
  log('\n========================================', 'cyan');
  log('   i18n Synchronization Tool', 'bold');
  log('========================================\n', 'cyan');

  // Step 1: Read files
  log('📖 Reading translation files...', 'cyan');
  let { en, vi, cn } = readFiles();

  const enKeys = getAllKeys(en);
  const viKeys = getAllKeys(vi);
  const cnKeys = getAllKeys(cn);

  log(`   EN: ${enKeys.length} keys`, 'green');
  log(`   VI: ${viKeys.length} keys`, 'green');
  log(`   CN: ${cnKeys.length} keys\n`, 'green');

  // Step 2: Check for missing/extra keys
  log('🔍 Checking for missing/extra keys...', 'cyan');

  const missingInVi = enKeys.filter((k) => !viKeys.includes(k));
  const missingInCn = enKeys.filter((k) => !cnKeys.includes(k));
  const extraInVi = viKeys.filter((k) => !enKeys.includes(k));
  const extraInCn = cnKeys.filter((k) => !enKeys.includes(k));

  let needsFix = false;

  if (missingInVi.length > 0 || extraInVi.length > 0) {
    needsFix = true;
    log(
      `   VI: ${missingInVi.length} missing, ${extraInVi.length} extra`,
      'yellow'
    );

    missingInVi.forEach((key) => {
      setNestedValue(vi, key, getNestedValue(en, key));
    });
    extraInVi.forEach((key) => {
      deleteNestedKey(vi, key);
    });
  }

  if (missingInCn.length > 0 || extraInCn.length > 0) {
    needsFix = true;
    log(
      `   CN: ${missingInCn.length} missing, ${extraInCn.length} extra`,
      'yellow'
    );

    missingInCn.forEach((key) => {
      setNestedValue(cn, key, getNestedValue(en, key));
    });
    extraInCn.forEach((key) => {
      deleteNestedKey(cn, key);
    });
  }

  if (!needsFix) {
    log('   ✅ No missing or extra keys\n', 'green');
  } else {
    log('   ✅ Keys synchronized\n', 'green');
  }

  // Step 3: Remove empty objects
  log('🗑️  Removing empty objects...', 'cyan');

  const emptyInVi = findEmptyObjects(vi);
  const emptyInCn = findEmptyObjects(cn);

  emptyInVi.forEach((path) => deleteNestedKey(vi, path));
  emptyInCn.forEach((path) => deleteNestedKey(cn, path));

  if (emptyInVi.length > 0 || emptyInCn.length > 0) {
    log(
      `   Removed ${emptyInVi.length + emptyInCn.length} empty objects\n`,
      'green'
    );
  } else {
    log('   ✅ No empty objects found\n', 'green');
  }

  // Step 4: Sort keys
  log('📋 Sorting keys to match EN order...', 'cyan');
  vi = sortObjectByReference(vi, en);
  cn = sortObjectByReference(cn, en);
  log('   ✅ Keys sorted\n', 'green');

  // Step 5: Write files
  log('💾 Writing files...', 'cyan');
  fs.writeFileSync(
    path.join(messagesDir, 'vi.json'),
    JSON.stringify(vi, null, 2) + '\n',
    'utf8'
  );
  fs.writeFileSync(
    path.join(messagesDir, 'cn.json'),
    JSON.stringify(cn, null, 2) + '\n',
    'utf8'
  );
  log('   ✅ Files updated\n', 'green');

  // Step 6: Final verification
  log('✅ Verification...', 'cyan');
  const finalEn = getAllKeys(en);
  const finalVi = getAllKeys(vi);
  const finalCn = getAllKeys(cn);

  log(`   EN: ${finalEn.length} keys`, 'green');
  log(`   VI: ${finalVi.length} keys`, 'green');
  log(`   CN: ${finalCn.length} keys`, 'green');

  const allSynced =
    finalEn.length === finalVi.length && finalEn.length === finalCn.length;

  if (allSynced) {
    log('\n========================================', 'cyan');
    log('   ✨ All files synchronized! ✨', 'bold');
    log('========================================\n', 'cyan');
  } else {
    log('\n⚠️  Warning: Files may not be fully synchronized\n', 'yellow');
  }
}

main();
