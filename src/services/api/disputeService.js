import apiClient from './apiClient';

// ─── USER: Submit a new complaint ────────────────────────────────────────────
export const createComplaint = async (formData) => {
  try {
    const response = await apiClient.post('/dispute', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to submit complaint.' };
  }
};

// ─── USER: Get current user's own complaints ─────────────────────────────────
export const getMyComplaints = async (page = 1, pageSize = 10) => {
  try {
    const response = await apiClient.get('/dispute/my', {
      params: { page, pageSize },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch complaints.' };
  }
};

// ─── USER: Delete a pending complaint ──────────────────────────────────────────
export const deleteComplaint = async (disputeId) => {
  try {
    const response = await apiClient.delete(`/dispute/${disputeId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete complaint.' };
  }
};

// ─── ADMIN: Get all disputes ──────────────────────────────────────────────────
export const getAllDisputes = async (searchQuery = '', page = 1, pageSize = 10) => {
  try {
    const response = await apiClient.get('/dispute', {
      params: { searchQuery, page, pageSize },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch disputes.' };
  }
};

// ─── ADMIN: Update dispute status ─────────────────────────────────────────────
export const updateDisputeStatus = async (disputeId, status, adminNote = '') => {
  try {
    const response = await apiClient.patch(`/dispute/${disputeId}/status`, {
      status,
      adminNote,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update dispute status.' };
  }
};
