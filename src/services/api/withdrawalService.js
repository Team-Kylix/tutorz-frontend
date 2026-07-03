import apiClient from './apiClient';

/**
 * Get withdrawals for the logged-in Tutor.
 * @param {string|null} instituteId
 */
export const getTutorWithdrawals = async (instituteId = null) => {
  const params = {};
  if (instituteId) params.instituteId = instituteId;
  const response = await apiClient.get('/withdrawal/tutor', { params });
  return response.data;
};

/**
 * Get withdrawals for the logged-in Institute.
 * @param {string|null} tutorId
 */
export const getInstituteWithdrawals = async (tutorId = null) => {
  const params = {};
  if (tutorId) params.tutorId = tutorId;
  const response = await apiClient.get('/withdrawal/institute', { params });
  return response.data;
};

/**
 * Get available balance.
 * - Tutor calls this with { instituteId } only — tutorId resolved from JWT server-side.
 * - Institute calls this with { tutorId } only — instituteId resolved from JWT server-side.
 * @param {{ tutorId?: string, instituteId?: string }} params
 */
export const getAvailableBalance = async ({ tutorId, instituteId } = {}) => {
  const params = {};
  if (tutorId) params.tutorId = tutorId;
  if (instituteId) params.instituteId = instituteId;
  const response = await apiClient.get('/withdrawal/balance', { params });
  return response.data;
};

/**
 * Tutor requests a withdrawal — sends notification to Institute only.
 * @param {{ instituteId: string, requestedAmount: number }} dto
 */
export const requestWithdrawalNotification = async (dto) => {
  const response = await apiClient.post('/withdrawal/request-notification', dto);
  return response.data;
};

/**
 * Institute processes a withdrawal for a Tutor.
 * @param {{ tutorId: string, withdrawalAmount: number, paymentMethod: string }} dto
 */
export const processWithdrawal = async (dto) => {
  const response = await apiClient.post('/withdrawal/process', dto);
  clearWithdrawalCache();
  return response.data;
};

/**
 * Download the withdrawal receipt PDF.
 * @param {string} withdrawalId
 * @param {string} filename
 */
export const downloadWithdrawalPdf = async (withdrawalId, filename = 'Withdrawal_Receipt.pdf') => {
  const response = await apiClient.get(`/withdrawal/${withdrawalId}/pdf`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Get the withdrawal OVERVIEW for the logged-in Tutor.
 * Returns one row per institute even with no withdrawal yet.
 * @param {string|null} instituteId
 */
export const getTutorWithdrawalOverview = async (instituteId = null) => {
  const params = {};
  if (instituteId) params.instituteId = instituteId;
  const response = await apiClient.get('/withdrawal/overview', { params });
  return response.data;
};

/**
 * Get the withdrawal OVERVIEW for the logged-in Institute.
 * Returns one row per tutor even with no withdrawal yet.
 * @param {string|null} tutorId
 */
let withdrawalOverviewCache = {};

export const clearWithdrawalCache = () => {
  withdrawalOverviewCache = {};
};

export const getInstituteWithdrawalOverview = async (tutorId = null, bypassCache = false) => {
  const cacheKey = tutorId || 'ALL';
  if (!bypassCache && withdrawalOverviewCache[cacheKey]) {
    return withdrawalOverviewCache[cacheKey];
  }

  const params = {};
  if (tutorId) params.tutorId = tutorId;
  if (bypassCache) params._t = Date.now();
  
  const response = await apiClient.get('/withdrawal/overview-institute', { params });
  withdrawalOverviewCache[cacheKey] = response.data;
  return response.data;
};

/**
 * Download the pending earnings report PDF for Tutor.
 * @param {string|null} instituteId
 */
export const downloadOverviewPdf = async (instituteId = null, filename = 'Pending_Earnings_Report.pdf') => {
  const params = {};
  if (instituteId) params.instituteId = instituteId;
  const response = await apiClient.get('/withdrawal/overview-pdf', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Download the pending payouts report PDF for Institute.
 * @param {string|null} tutorId
 */
export const downloadInstituteOverviewPdf = async (tutorId = null, filename = 'Pending_Payouts_Report.pdf') => {
  const params = {};
  if (tutorId) params.tutorId = tutorId;
  const response = await apiClient.get('/withdrawal/overview-institute-pdf', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const getTutorMonthlyFees = async (instituteId = null) => {
  const params = {};
  if (instituteId) params.instituteId = instituteId;
  const response = await apiClient.get('/withdrawal/tutor/fees', { params });
  return response.data;
};

export const getInstituteMonthlyFees = async (tutorId = null) => {
  const params = {};
  if (tutorId) params.tutorId = tutorId;
  const response = await apiClient.get('/withdrawal/institute/fees', { params });
  return response.data;
};

export const downloadTutorMonthlyFeesPdf = async (year, month, instituteId = null) => {
  const params = { year, month };
  if (instituteId) params.instituteId = instituteId;
  const response = await apiClient.get('/withdrawal/tutor/fees/pdf', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Fees_Report_${year}_${month}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadInstituteMonthlyFeesPdf = async (year, month, tutorId = null) => {
  const params = { year, month };
  if (tutorId) params.tutorId = tutorId;
  const response = await apiClient.get('/withdrawal/institute/fees/pdf', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Fees_Report_${year}_${month}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
