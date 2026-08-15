/**
 * Client-side input validation helpers for Rahbar Smart Campus
 */

// Email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone number regex (allows +, digits, spaces, hyphens; must contain 10-15 digits)
const PHONE_REGEX = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

/**
 * Validates email address format
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) return 'Email address is required.';
  if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address (e.g. user@domain.com).';
  return null;
};

/**
 * Validates password strength & length
 */
export const validatePassword = (password, minLength = 6) => {
  if (!password) return 'Password is required.';
  if (password.length < minLength) return `Password must be at least ${minLength} characters long.`;
  return null;
};

/**
 * Validates phone numbers
 */
export const validatePhone = (phone, required = true) => {
  if (!phone || !phone.trim()) {
    if (required) return 'Phone number is required.';
    return null;
  }
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return 'Phone number must contain between 10 and 15 digits.';
  }
  return null;
};

/**
 * Validates person names (Full Name, Father's Name)
 */
export const validateName = (name, fieldName = 'Name') => {
  if (!name || !name.trim()) return `${fieldName} is required.`;
  const trimmed = name.trim();
  if (trimmed.length < 2) return `${fieldName} must be at least 2 characters long.`;
  if (/^\d+$/.test(trimmed)) return `${fieldName} cannot consist of numbers only.`;
  return null;
};

/**
 * Validates student CGPA
 */
export const validateCGPA = (cgpa) => {
  const num = Number(cgpa);
  if (isNaN(num)) return 'CGPA must be a valid number.';
  if (num < 0 || num > 4.0) return 'CGPA must be between 0.00 and 4.00.';
  return null;
};

/**
 * Validates Course Code (e.g., CS101, EE204)
 */
export const validateCourseCode = (code) => {
  if (!code || !code.trim()) return 'Course code is required.';
  const trimmed = code.trim().toUpperCase();
  if (trimmed.length < 3 || trimmed.length > 12) return 'Course code must be between 3 and 12 characters.';
  if (!/^[A-Z0-9-]+$/i.test(trimmed)) return 'Course code can only contain letters, numbers, and hyphens.';
  return null;
};

/**
 * Validates positive numerical values (amounts, total marks, capacities)
 */
export const validatePositiveNumber = (val, fieldName = 'Amount', allowZero = false) => {
  const num = Number(val);
  if (val === '' || val === null || val === undefined || isNaN(num)) {
    return `${fieldName} must be a valid number.`;
  }
  if (allowZero ? num < 0 : num <= 0) {
    return `${fieldName} must be ${allowZero ? 'greater than or equal to 0' : 'greater than 0'}.`;
  }
  return null;
};

/**
 * Validates numeric range
 */
export const validateNumberRange = (val, min, max, fieldName = 'Value') => {
  const num = Number(val);
  if (val === '' || val === null || val === undefined || isNaN(num)) {
    return `${fieldName} must be a valid number.`;
  }
  if (num < min || num > max) {
    return `${fieldName} must be between ${min} and ${max}.`;
  }
  return null;
};

/**
 * Validates Date Range (startDate <= endDate)
 */
export const validateDateRange = (startDate, endDate, startLabel = 'Start Date', endLabel = 'End Date') => {
  if (!startDate) return `${startLabel} is required.`;
  if (!endDate) return `${endLabel} is required.`;
  if (new Date(startDate) > new Date(endDate)) {
    return `${endLabel} cannot be earlier than ${startLabel}.`;
  }
  return null;
};

/**
 * Validates uploaded image files (profile photos)
 */
export const validateImageFile = (file, maxSizeMB = 5) => {
  if (!file) return null;
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return 'Invalid file format. Only JPG, PNG, and WebP images are allowed.';
  }
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `File size exceeds the limit of ${maxSizeMB}MB.`;
  }
  return null;
};

/**
 * Validates exam score / marks
 */
export const validateExamMarks = (obtainedMarks, totalMarks) => {
  const obtained = Number(obtainedMarks);
  const total = Number(totalMarks);
  if (isNaN(obtained) || obtained < 0) return 'Obtained marks cannot be negative.';
  if (!isNaN(total) && obtained > total) return `Obtained marks cannot exceed total marks (${total}).`;
  return null;
};
