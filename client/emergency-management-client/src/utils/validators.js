// Validation utilities for the emergency management client

/**
 * Validates that a TZ (Israeli ID) is exactly 9 digits.
 * @param {string|number} tz
 * @returns {{valid: boolean, error?: string}}
 */
export function validateTz(tz) {
  const tzStr = String(tz ?? '').trim();

  if (!tzStr) {
    return { valid: false, error: 'תעודת זהות היא שדה חובה' };
  }

  if (!/^\d{8,9}$/.test(tzStr)) {
    return { valid: false, error: 'תעודת זהות חייבת להכיל 8 או 9 ספרות' };
  }

  return { valid: true };
}

/**
 * Simple helper to check if TZ is valid (boolean only)
 */
export function isValidTz(tz) {
  return validateTz(tz).valid;
}
