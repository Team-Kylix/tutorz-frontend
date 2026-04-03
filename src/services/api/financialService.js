import apiClient from './apiClient';

// ─── Bank Directory ───────────────────────────────────────────────
export const getBanks = async () => {
  try {
    const response = await apiClient.get('/financials/banks');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch banks' };
  }
};

export const getBranchesByBank = async (bankCode) => {
  try {
    const response = await apiClient.get(`/financials/banks/${bankCode}/branches`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch branches' };
  }
};

// ─── Financial Summary ───────────────────────────────────────────
export const getFinancialSummary = async () => {
  try {
    const response = await apiClient.get('/financials/summary');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch financial summary' };
  }
};

// ─── Bank Details (Tutor + Institute only) ───────────────────────
export const saveBankDetails = async (data) => {
  try {
    const response = await apiClient.post('/financials/bank-details', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to save bank details' };
  }
};

export const removeBankDetails = async () => {
  try {
    const response = await apiClient.delete('/financials/bank-details');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to remove bank details' };
  }
};

// ─── Card Token (all roles) ──────────────────────────────────────
export const saveCardToken = async (data) => {
  try {
    const response = await apiClient.post('/financials/card-token', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to save card details' };
  }
};

export const removeCardToken = async () => {
  try {
    const response = await apiClient.delete('/financials/card-token');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to remove card' };
  }
};

// ─── Mock PayHere Tokenization ───────────────────────────────────
/**
 * Simulates the PayHere frontend SDK.
 * In production, replace this entire function with the real PayHere.js SDK call.
 * The real SDK sends the card number directly to PayHere's servers and returns a token.
 * We NEVER receive the real card number in our own API.
 */
export const mockPayHereTokenize = async (cardDetails) => {
  // Simulate a short network delay (PayHere would do this in production)
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Detect card brand from first digit
  const firstDigit = cardDetails.cardNumber.replace(/\s/g, '')[0];
  const brand =
    firstDigit === '4' ? 'Visa' :
    firstDigit === '5' ? 'Mastercard' :
    firstDigit === '3' ? 'Amex' :
    firstDigit === '6' ? 'Discover' : 'Card';

  const last4 = cardDetails.cardNumber.replace(/\s/g, '').slice(-4);
  const mockToken = `payhere_mock_token_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  return {
    token: mockToken,
    last4,
    brand,
    cardholderName: cardDetails.cardholderName,
  };
};
