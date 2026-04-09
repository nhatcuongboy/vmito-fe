export interface Bank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
  short_name: string;
  support: number;
  isTransfer: number;
  swift_code: string;
  deepLink?: string;
}

// Global cache to avoid multiple API calls in the same session
let banksCache: Bank[] | null = null;

export const getVietnamBanks = async (): Promise<Bank[]> => {
  if (banksCache) return banksCache;

  try {
    const response = await fetch('https://api.vietqr.io/v2/banks');
    const result = await response.json();
    if (result.code === '00' && Array.isArray(result.data)) {
      banksCache = result.data.map((bank: Bank) => ({
        ...bank,
        deepLink: `https://dl.vietqr.io/pay?app=${bank.code.toLowerCase()}`,
      }));
      return banksCache || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching banks:', error);
    return [];
  }
};

/**
 * @deprecated Use getVietnamBanks() instead.
 * This is kept for backward compatibility during migration.
 */
export const vietnamBanks: Bank[] = [];

export const RECOMMENDED_BANK_CODES = [
  'ICB', // VietinBank - autofill supported
  'BIDV', // BIDV - autofill supported
  'OCB', // OCB - autofill supported
  'ACB', // ACB - autofill supported
  'MB',
  'VCB',
  'TCB',
  'TPB',
  'VPB',
];

/**
 * Fuzzy-match a freetext bank name (as entered by host) to a bank in the list.
 * Returns the bank entry or null.
 *
 * NOTE: This now requires the bank list to be passed in since it's fetched asynchronously.
 */
export const findBankInList = (bankName: string, bankList: Bank[]) => {
  if (!bankName || !bankList.length) return null;
  const q = bankName.toLowerCase().trim();
  return (
    bankList.find(
      (b) =>
        b.code.toLowerCase() === q ||
        b.shortName.toLowerCase() === q ||
        q.includes(b.shortName.toLowerCase()) ||
        q.includes(b.code.toLowerCase()) ||
        b.name.toLowerCase().includes(q)
    ) ?? null
  );
};

/**
 * @deprecated Use findBankInList with pre-fetched banks instead.
 */
export const findBankByName = (bankName: string, bankList?: Bank[]) => {
  if (!bankName) return null;
  const q = bankName.toLowerCase().trim();
  const listToSearch = bankList || vietnamBanks;
  return (
    listToSearch.find(
      (b) =>
        b.code.toLowerCase() === q ||
        b.shortName.toLowerCase() === q ||
        q.includes(b.shortName.toLowerCase()) ||
        q.includes(b.code.toLowerCase()) ||
        b.name.toLowerCase().includes(q)
    ) ?? null
  );
};

/**
 * Generate a VietQR image URL for a bank account.
 * Uses https://img.vietqr.io/image/{bankCode}-{accountNo}-{template}.png
 */
export const getVietQRImageUrl = (
  bankCodeOrName: string,
  accountNumber: string,
  options?: {
    template?: 'compact' | 'qr_only' | 'print';
    accountName?: string;
    addInfo?: string;
    amount?: number;
    bankList?: Bank[];
  }
): string | null => {
  if (!bankCodeOrName || !accountNumber) return null;

  let finalCode = bankCodeOrName;

  // If it looks like a long name, try to resolve it first
  if (bankCodeOrName.length > 10 && options?.bankList) {
    const resolved = findBankInList(bankCodeOrName, options.bankList);
    if (resolved) finalCode = resolved.code;
  }

  const template = options?.template ?? 'compact';
  const url = new URL(
    `https://img.vietqr.io/image/${finalCode.toLowerCase()}-${accountNumber}-${template}.png`
  );

  if (options?.accountName) {
    url.searchParams.set('accountName', options.accountName);
  }
  if (options?.addInfo) {
    url.searchParams.set('addInfo', options.addInfo);
  }
  if (options?.amount) {
    url.searchParams.set('amount', String(options.amount));
  }

  return url.toString();
};
