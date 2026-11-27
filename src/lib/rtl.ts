const URDU_ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function containsUrduScript(text: string): boolean {
  return URDU_ARABIC_REGEX.test(text);
}

export function getTextDirection(text: string): 'rtl' | 'ltr' {
  return containsUrduScript(text) ? 'rtl' : 'ltr';
}

export function sanitizePlainText(input: string): string {
  return input.replace(/[<>]/g, '').trim();
}
