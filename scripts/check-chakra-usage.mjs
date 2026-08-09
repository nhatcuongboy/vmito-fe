import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, 'src');
const allowlistPath = path.join(projectRoot, 'scripts', 'chakra-allowlist.txt');
const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const chakraImportPattern =
  /(?:from\s*|import\s*\(\s*|import\s*|require\s*\(\s*)['"]@chakra-ui\/[^'"]+['"]/g;

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectSourceFiles(entryPath);
      return sourceExtensions.has(path.extname(entry.name)) ? [entryPath] : [];
    })
  );

  return files.flat();
}

async function collectChakraImports() {
  const files = await collectSourceFiles(sourceRoot);
  const usages = new Map();

  await Promise.all(
    files.map(async (filePath) => {
      const source = await readFile(filePath, 'utf8');
      const count = [...source.matchAll(chakraImportPattern)].length;
      if (count > 0) {
        usages.set(path.relative(projectRoot, filePath), count);
      }
    })
  );

  return new Map(
    [...usages].sort(([left], [right]) => left.localeCompare(right))
  );
}

function serializeAllowlist(usages) {
  const header = [
    '# Chakra UI migration allowlist.',
    '# Format: <relative path>\\t<allowed import count>.',
    '# Run `pnpm ui:audit:chakra:update` only when a migration removes imports.',
  ];
  const rows = [...usages].map(([filePath, count]) => `${filePath}\t${count}`);
  return `${[...header, ...rows].join('\n')}\n`;
}

async function readAllowlist() {
  const contents = await readFile(allowlistPath, 'utf8');
  const rows = contents
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  return new Map(
    rows.map((row) => {
      const [filePath, rawCount] = row.split(/\s+/);
      const count = Number(rawCount);
      if (!filePath || !Number.isInteger(count) || count < 1) {
        throw new Error(`Invalid Chakra allowlist row: ${row}`);
      }
      return [filePath, count];
    })
  );
}

function summarize(usages) {
  const importCount = [...usages.values()].reduce(
    (total, count) => total + count,
    0
  );
  return `${usages.size} files / ${importCount} imports`;
}

const actual = await collectChakraImports();

if (process.argv.includes('--write')) {
  await writeFile(allowlistPath, serializeAllowlist(actual));
  console.log(`Updated Chakra allowlist: ${summarize(actual)}.`);
  process.exit(0);
}

const allowed = await readAllowlist();
const errors = [];

for (const [filePath, count] of actual) {
  const allowedCount = allowed.get(filePath);
  if (allowedCount === undefined) {
    errors.push(`New Chakra import is not allowed: ${filePath} (${count})`);
  } else if (count !== allowedCount) {
    errors.push(
      `Chakra count changed for ${filePath}: allowlist=${allowedCount}, actual=${count}`
    );
  }
}

for (const [filePath, count] of allowed) {
  if (!actual.has(filePath)) {
    errors.push(
      `Stale Chakra allowlist entry: ${filePath} (${count}); regenerate after migration`
    );
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  console.error(
    'Chakra usage may only decrease. Remove the new import or regenerate the allowlist after a completed migration.'
  );
  process.exit(1);
}

console.log(`Chakra audit passed: ${summarize(actual)} remain allowlisted.`);
