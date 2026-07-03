import apiClient from './apiClient';

/**
 * Service for managing platform billing, invoices and system configuration.
 */

// --- Admin Endpoints ---

export const getAllBills = async (search = '', page = 1, pageSize = 10) => {
    try {
        const response = await apiClient.get('/billing/bills', {
            params: { search, page, pageSize }
        });
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: error.message };
    }
};

export const triggerBillGeneration = async (month, year) => {
    try {
        const response = await apiClient.post('/billing/generate', { month, year });
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: error.message };
    }
};

export const markBillAsPaid = async (billId) => {
    try {
        const response = await apiClient.put(`/billing/bills/${billId}/mark-paid`);
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: error.message };
    }
};

export const getBillingConfig = async () => {
    try {
        const response = await apiClient.get('/system/billing-config');
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: error.message };
    }
};

export const updateBillingConfig = async (config) => {
    try {
        const response = await apiClient.put('/system/billing-config', config);
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: error.message };
    }
};

// --- User Endpoints ---

export const getMyBills = async (page = 1, pageSize = 10) => {
    try {
        const response = await apiClient.get('/billing/my-bills', {
            params: { page, pageSize }
        });
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: error.message };
    }
};

// --- Shared Endpoints ---

export const getBillById = async (billId) => {
    try {
        const response = await apiClient.get(`/billing/bills/${billId}`);
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: error.message };
    }
};

/**
 * Triggers a browser download of the bill PDF.
 */
export const downloadBillPdf = async (billId, reference = 'invoice') => {
    try {
        const response = await apiClient.get(`/billing/bills/${billId}/pdf`, {
            responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Tutorz_${reference}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        return { success: true };
    } catch (error) {
        console.error("PDF Download failed", error);
        return { success: false, message: "Failed to download PDF invoice." };
    }
};
