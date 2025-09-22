// lib/phone-utils.ts

/**
 * Format Indonesian phone number to international format
 * @param phone - Phone number in various formats
 * @returns Formatted phone number with +62 prefix
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // Handle different formats
  if (cleaned.startsWith('+62')) {
    return cleaned
  } else if (cleaned.startsWith('62')) {
    return '+' + cleaned
  } else if (cleaned.startsWith('0')) {
    return '+62' + cleaned.slice(1)
  } else if (cleaned.match(/^[1-9]/)) {
    return '+62' + cleaned
  }
  
  return phone // Return original if format not recognized
}

/**
 * Validate Indonesian phone number format
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function validatePhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone)
  
  // Indonesian phone numbers should be +62 followed by 8-13 digits
  const phoneRegex = /^\+62\d{8,13}$/
  
  return phoneRegex.test(formatted)
}

/**
 * Format phone number for display (remove +62 and add 0)
 * @param phone - International format phone number
 * @returns Display format (0xxx)
 */
export function formatPhoneForDisplay(phone: string): string {
  if (phone.startsWith('+62')) {
    return '0' + phone.slice(3)
  }
  return phone
}

/**
 * Mask phone number for privacy (show only first 3 and last 3 digits)
 * @param phone - Phone number to mask
 * @returns Masked phone number
 */
export function maskPhoneNumber(phone: string): string {
  const display = formatPhoneForDisplay(phone)
  if (display.length < 7) return display
  
  const start = display.slice(0, 4) // 0xxx
  const end = display.slice(-3) // xxx
  const middle = '*'.repeat(display.length - 7)
  
  return start + middle + end
}