import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export class UnsupportedFileError extends Error {}

const getExtension = (name: string): string => {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : '';
};

const arrayBufferToText = async (file: File): Promise<string> => {
  return await file.text();
};

const parseCsv = async (file: File): Promise<string> => {
  const text = await arrayBufferToText(file);
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
  return result.data
    .map((row) =>
      row
        .map((cell) => (cell ?? '').toString().trim())
        .filter((cell) => cell.length > 0)
        .join(' | ')
    )
    .filter((line) => line.length > 0)
    .join('\n');
};

const parseExcel = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const parts: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    const trimmed = csv.trim();
    if (!trimmed) continue;
    if (workbook.SheetNames.length > 1) {
      parts.push(`# ${sheetName}\n${trimmed}`);
    } else {
      parts.push(trimmed);
    }
  }
  return parts.join('\n\n');
};

/**
 * Parses a user-uploaded CSV/Excel file into plain text that can be sent to AI.
 * Throws `UnsupportedFileError` for unsupported file types.
 */
export const parseScheduleFile = async (file: File): Promise<string> => {
  if (file.size > MAX_FILE_SIZE) {
    throw new UnsupportedFileError('FILE_TOO_LARGE');
  }
  const ext = getExtension(file.name);
  if (ext === 'csv') return await parseCsv(file);
  if (ext === 'xlsx' || ext === 'xls') return await parseExcel(file);
  throw new UnsupportedFileError('UNSUPPORTED_TYPE');
};
