/**
 * Indian Mobile Number Validation, Normalization & Deterministic ID Utilities
 * Primary Target: India (+91)
 * Normalized Format: +919649183422
 */

/**
 * Normalizes any valid Indian mobile number input into strict E.164 format (+91XXXXXXXXXX).
 *
 * Examples that all resolve to "+919649183422":
 * - "9649183422"
 * - "+91 9649183422"
 * - "+91-9649183422"
 * - "+919649183422"
 * - "09649183422"
 * - "919649183422"
 *
 * Returns null if the input is not a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).
 */
export function normalizeIndianMobileNumber(rawInput: string | null | undefined): string | null {
  if (!rawInput) return null;

  // Strip all whitespace, hyphens, parentheses, dots
  const cleaned = String(rawInput).replace(/[\s\-().]/g, '');

  let tenDigit = '';

  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    tenDigit = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    tenDigit = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    tenDigit = cleaned.slice(1);
  } else if (cleaned.length === 10) {
    tenDigit = cleaned;
  } else {
    return null;
  }

  // Indian mobile numbers must be 10 digits starting with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(tenDigit)) {
    return null;
  }

  return `+91${tenDigit}`;
}

/**
 * Validates whether the provided string can be normalized to a valid Indian mobile number.
 */
export function isValidIndianMobileNumber(rawInput: string | null | undefined): boolean {
  return normalizeIndianMobileNumber(rawInput) !== null;
}

/**
 * Extracts the 10-digit Indian subscriber number (e.g. "9649183422") from a normalized or raw number.
 */
export function extract10DigitMobile(mobile: string | null | undefined): string {
  const normalized = normalizeIndianMobileNumber(mobile);
  if (normalized) {
    return normalized.slice(3);
  }
  const digits = String(mobile || '').replace(/\D/g, '');
  return digits.slice(-10);
}

/**
 * Formats a mobile number for human-readable display: "+91 9649183422"
 */
export function formatDisplayMobileNumber(mobile: string | null | undefined): string {
  const normalized = normalizeIndianMobileNumber(mobile);
  if (normalized) {
    return `+91 ${normalized.slice(3)}`;
  }
  const raw = String(mobile || '').trim();
  return raw || 'Not provided';
}

/**
 * Generates a deterministic UUID-formatted identifier from a normalized mobile number (+91XXXXXXXXXX)
 * so the same mobile number always resolves to the same canonical user ID across sessions and databases.
 */
export function deriveDeterministicUserUuid(normalizedMobile: string): string {
  const normalized = normalizeIndianMobileNumber(normalizedMobile) || normalizedMobile.trim();
  // Deterministic 128-bit hash from "+91XXXXXXXXXX"
  let h1 = 0xdeadbeef ^ normalized.length;
  let h2 = 0x41c6ce57 ^ normalized.length;
  let h3 = 0x9e3779b9 ^ normalized.length;
  let h4 = 0x85ebca6b ^ normalized.length;

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const hex4 = (h4 >>> 0).toString(16).padStart(8, '0');

  return `${hex1}-${hex2.slice(0, 4)}-4${hex2.slice(5, 8)}-a${hex3.slice(1, 4)}-${hex3.slice(4, 8)}${hex4}`;
}

/**
 * Generates a deterministic formatted User ID (e.g. USER-104829) from user UUID or mobile number.
 */
export function deriveFormattedUserId(normalizedMobile: string): string {
  const digits = extract10DigitMobile(normalizedMobile);
  if (digits.length === 10) {
    return `USER-${digits.slice(-6)}`;
  }
  return 'USER-000001';
}
