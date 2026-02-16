/**
 * Extracts a readable error message from an Axios error object.
 */
export const extractErrorMessage = (error) => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  return error.message || 'An unexpected error occurred.';
};

/**
 * Formats a date string to a readable format (e.g., DD MMM YYYY).
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

import { CURRENCY } from './constants';

/**
 * Formats currency (e.g., LKR 1,000.00).
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat(CURRENCY.LOCALE, {
    style: 'currency',
    currency: CURRENCY.CODE,
  }).format(amount);
};