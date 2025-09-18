const SAUDI_ID_REGEX = /^[12]\d{9}$/;

export function validateSaudiId(value: string | undefined | null): boolean {
  if (!value) return false;
  return SAUDI_ID_REGEX.test(value);
}
