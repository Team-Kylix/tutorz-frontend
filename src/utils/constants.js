
export const ROLES = {
  STUDENT: 'Student',
  TUTOR: 'Tutor',
  INSTITUTE: 'Institute',
  ADMIN: 'Admin',
};

export const API_URLS = {
  // Centralize your endpoints here
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  SOCIAL_LOGIN: '/api/auth/social-login',
};

export const REGEX = {
  // Sri Lankan phone number: Starts with 07, followed by 8 digits
  SRI_LANKAN_PHONE: /^07\d{8}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

export const ERROR_MESSAGES = {
  REQUIRED: 'This field is required.',
  INVALID_PHONE: 'Must be 10 digits starting with 07 (e.g., 0712345678).',
  INVALID_EMAIL: 'Please enter a valid email address.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
};

export const GRADE_GROUPS = [
  { label: "Primary Education", options: ['Preschool', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'] },
  { label: "Secondary Education", options: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11 (O/L)', 'Grade 12 (A/L)', 'Grade 13 (A/L)'] },
  { label: "Other", options: ['Course', 'Seminar', 'Workshop'] }
];