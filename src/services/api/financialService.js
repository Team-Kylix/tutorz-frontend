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

// ─── PayHere Preapproval (Card Tokenization) ─────────────────────
/**
 * Requests the backend to generate PayHere preapproval parameters.
 * The returned object is passed directly to window.payhere.startPayment().
 * PayHere charges Rs.1 (auto-refunded) and returns a customer_token to our notify_url.
 */
export const initiatePreapproval = async () => {
  try {
    const response = await apiClient.post('/financials/initiate-preapproval');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to initiate card preapproval' };
  }
};

// ─── Online Fee Payments (Student) ───────────────────────────────
export const getStudentPaymentStatus = async (classId) => {
  try {
    const response = await apiClient.get('/financials/student-payment-status', {
      params: { classId }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch payment status' };
  }
};

export const initiateOnlinePayment = async (data) => {
  try {
    const response = await apiClient.post('/financials/initiate-payment', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to initiate payment' };
  }
};

export const initiateBillPayment = async (data) => {
  try {
    const response = await apiClient.post('/financials/initiate-bill-payment', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to initiate bill payment' };
  }
};
