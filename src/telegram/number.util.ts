const MYANMAR_DIGITS: Record<string, string> = {
  '၀': '0',
  '၁': '1',
  '၂': '2',
  '၃': '3',
  '၄': '4',
  '၅': '5',
  '၆': '6',
  '၇': '7',
  '၈': '8',
  '၉': '9',
};

const BURMESE_NUMBER_WORDS: Record<string, number> = {
  သုည: 0,
  တစ်: 1,
  တစ္: 1,
  တ: 1,
  နှစ်: 2,
  'ႏွစ္': 2,
  နစ်: 2,
  သုံး: 3,
  သံုး: 3,
  လေး: 4,
  'ေလး': 4,
  လေ: 4,
  ငါး: 5,
  ခြောက်: 6,
  'ေျခာက္': 6,
  ခြောက: 6,
  ခုနစ်: 7,
  ခုႏွစ္: 7,
  ခုနှစ်: 7,
  ခုနှစ္: 7,
  ခုနှစ: 7,
  ရှစ်: 8,
  ရွစ္: 8,
  ရှစ: 8,
  ကိုး: 9,
  တစ်ဆယ်: 10,
  တစ္ဆယ္: 10,
  ဆယ်: 10,
  ဆယ္: 10,
};

export function normalizeMyanmarDigits(text: string): string {
  return [...text].map((char) => MYANMAR_DIGITS[char] ?? char).join('');
}

export function parseMyanmarNumber(text: string): number | null {
  const normalizedText = normalizeMyanmarDigits(text).trim();
  if (/^\d+$/.test(normalizedText)) {
    return Number(normalizedText);
  }

  const compactText = text.replace(/\s+/g, '');
  return BURMESE_NUMBER_WORDS[compactText] ?? null;
}
