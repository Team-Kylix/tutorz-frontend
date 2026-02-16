import { REGEX, ERROR_MESSAGES, SOCIAL_PROVIDERS } from './constants';

export const validatePhoneNumber = (phone) => {
  if (!phone) return { isValid: false, message: ERROR_MESSAGES.REQUIRED };
  if (!REGEX.SRI_LANKAN_PHONE.test(phone)) {
    return { isValid: false, message: ERROR_MESSAGES.INVALID_PHONE };
  }
  return { isValid: true, message: '' };
};

export const validateEmail = (email) => {
  if (!email) return { isValid: false, message: ERROR_MESSAGES.REQUIRED };
  if (!REGEX.EMAIL.test(email)) {
    return { isValid: false, message: ERROR_MESSAGES.INVALID_EMAIL };
  }
  return { isValid: true, message: '' };
};

export const validatePassword = (password) => {
  if (!password) return { isValid: false, message: ERROR_MESSAGES.REQUIRED };
  if (!REGEX.PASSWORD.test(password)) {
    return { isValid: false, message: ERROR_MESSAGES.INVALID_PASSWORD };
  }
  return { isValid: true, message: '' };
}

export const validateRequired = (value, fieldName = 'Field') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: false, message: ERROR_MESSAGES.REQUIRED };
  }
  return { isValid: true, message: '' };
};

export const validateSocialProvider = (provider) => {
  if (provider === SOCIAL_PROVIDERS.APPLE) {
    return { isValid: false, message: ERROR_MESSAGES.APPLE_LOGIN_SOON };
  }
  return { isValid: true, message: '' };
};