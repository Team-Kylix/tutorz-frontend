export const ROLES = {
  STUDENT: 'Student',
  TUTOR: 'Tutor',
  INSTITUTE: 'Institute',
  ADMIN: 'Admin',
};

export const API_URLS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  SOCIAL_LOGIN: '/auth/social-login',
  Check_EMAIL: '/auth/check-email',
  CHECK_STATUS: '/auth/check-status',
  SEND_OTP: '/auth/send-otp',
  VERIFY_OTP: '/auth/verify-otp',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  REGISTER_SIBLING: '/auth/register-sibling',
  
  // Location
  PROVINCES: '/locations/provinces',
  DISTRICTS: '/locations/districts',
  CITIES: '/locations/cities',
};

export const REGEX = {
  // Sri Lankan phone number: Starts with 07, followed by 8 digits
  SRI_LANKAN_PHONE: /^07\d{8}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^.{6,10}$/, // Example based on RegisterForm usage
};

export const ERROR_MESSAGES = {
  REQUIRED: 'This field is required.',
  INVALID_PHONE: 'Must be 10 digits starting with 07 (e.g., 0712345678).',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PASSWORD: 'Password must be between 6 and 10 characters.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  ROLE_REQUIRED: 'Please select a role first.',
  APPLE_LOGIN_SOON: 'Apple Login is coming soon.',
  ALREADY_REGISTERED: 'You are already registered. Please log in.',
  ACCOUNT_EXISTS: 'This account already exists. Please log in.',
  GOOGLE_FAILED: 'Google registration failed.',
  OTP_FAILED: 'Failed to send verification code.',
};

export const CURRENCY = {
  CODE: 'LKR',
  LOCALE: 'en-LK',
};

export const SOCIAL_PROVIDERS = {
  GOOGLE: 'google',
  APPLE: 'apple',
};