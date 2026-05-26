import apiClient from './apiClient';

/**
 * Get withdrawals for the logged-in Tutor.
 * @param {string|null} instituteId
 * @param {string|null} classId
 */
export const getTutorWithdrawals = async (instituteId = null, classId = null) => {
  const params = {};
  if (instituteId) params.instituteId = instituteId;
  if (classId) params.classId = classId;
  const response = await apiClient.get('/withdrawal/tutor', { params });
  return response.data;
};

/**
 * Get withdrawals for the logged-in Institute.
 * @param {string|null} tutorId
 * @param {string|null} classId
 */
export const getInstituteWithdrawals = async (tutorId = null, classId = null) => {
  const params = {};
  if (tutorId) params.tutorId = tutorId;
  if (classId) params.classId = classId;
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
 * Returns one row per institute (or per class if classId provided) even with no withdrawal yet.
 * @param {string|null} instituteId
 * @param {string|null} classId
 */
export const getTutorWithdrawalOverview = async (instituteId = null, classId = null) => {
  const params = {};
  if (instituteId) params.instituteId = instituteId;
  if (classId) params.classId = classId;
  const response = await apiClient.get('/withdrawal/overview', { params });
  return response.data;
};

/**
 * Get the withdrawal OVERVIEW for the logged-in Institute.
 * Returns one row per tutor (or per class if classId provided) even with no withdrawal yet.
 * @param {string|null} tutorId
 * @param {string|null} classId
 */
export const getInstituteWithdrawalOverview = async (tutorId = null, classId = null) => {
  const params = {};
  if (tutorId) params.tutorId = tutorId;
  if (classId) params.classId = classId;
  const response = await apiClient.get('/withdrawal/overview-institute', { params });
  return response.data;
};

/**
 * Download the pending earnings report PDF for Tutor.
 * @param {string|null} instituteId
 * @param {string|null} classId
 */
export const downloadOverviewPdf = async (instituteId = null, classId = null, filename = 'Pending_Earnings_Report.pdf') => {
  const params = {};
  if (instituteId) params.instituteId = instituteId;
  if (classId) params.classId = classId;
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
 * @param {string|null} classId
 */
export const downloadInstituteOverviewPdf = async (tutorId = null, classId = null, filename = 'Pending_Payouts_Report.pdf') => {
  const params = {};
  if (tutorId) params.tutorId = tutorId;
  if (classId) params.classId = classId;
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
