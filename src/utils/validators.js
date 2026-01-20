import { REGEX } from './constants';

export const validatePhoneNumber = (phone) => {
  if (!phone) return { isValid: false, message: 'Phone number is required.' };
  if (!REGEX.SRI_LANKAN_PHONE.test(phone)) {
    return { isValid: false, message: 'Must be 10 digits starting with 07.' };
  }
  return { isValid: true, message: '' };
};

export const validateEmail = (email) => {
  if (!email) return { isValid: false, message: 'Email is required.' };
  if (!REGEX.EMAIL.test(email)) {
    return { isValid: false, message: 'Invalid email format.' };
  }
  return { isValid: true, message: '' };
};

export const validateRequired = (value, fieldName = 'Field') => {
  if (!value || value.trim() === '') {
    return { isValid: false, message: `${fieldName} is required.` };
  }
  return { isValid: true, message: '' };
};

export const validateSocialProvider = (provider) => {
  if (provider === 'apple') {
    return { isValid: false, message: 'Apple Login is coming soon.' };
  }
  return { isValid: true, message: '' };
};