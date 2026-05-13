import apiClient from './apiClient';

/**
 * GET /api/payment/status?classId=&studentId=
 * Returns 15-month payment status strip for a student+class pair.
 */
export const getPaymentStatus = async (classId, studentId) => {
    try {
        const response = await apiClient.get('/payment/status', {
            params: { classId, studentId }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch payment status' };
    }
};

/**
 * POST /api/payment/record
 * Records a class fee payment.
 */
export const recordPayment = async (payload) => {
    try {
        const response = await apiClient.post('/payment/record', payload);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to record payment' };
    }
};

export const getClassPaymentHistory = async (tutorId, classId, searchQuery = '', page = 1, pageSize = 10) => {
    try {
        const response = await apiClient.get(`/payment/class/history`, {
            params: {
                tutorId,
                classId: classId === 'all' ? null : classId,
                searchQuery,
                page,
                pageSize
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch payment history' };
    }
};

/**
 * GET /api/tutor/payments/history
 * Returns payment history for the logged-in tutor's own classes.
 * @param {string|null} instituteId - GUID for a specific institute, 'own' for My Own Place, or null/'' for all
 * @param {string|null} classId - GUID for a specific class, or null/'' for all
 * @param {string} searchQuery - Optional student search term
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Records per page
 */
export const getTutorPaymentHistory = async (instituteId, classId, searchQuery = '', page = 1, pageSize = 10) => {
    try {
        const params = new URLSearchParams();
        if (classId) params.append('classId', classId);

        if (instituteId === 'own') {
            params.append('noInstitute', 'true');
        } else if (instituteId) {
            params.append('instituteId', instituteId);
        }

        if (searchQuery) params.append('searchQuery', searchQuery);
        params.append('page', page.toString());
        params.append('pageSize', pageSize.toString());

        const response = await apiClient.get(`/tutor/payments/history?${params.toString()}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch tutor payment history' };
    }
};

/**
 * Downloads a class payment PDF for the logged-in tutor.
 * Calls GET /api/tutor/payments/{paymentId}/pdf — Tutor role only.
 * @param {string} paymentId - GUID of the ClassPayment record
 * @param {string} reference - Display reference for the filename
 */
export const downloadTutorPaymentPdf = async (paymentId, reference = 'ClassFee') => {
    try {
        const response = await apiClient.get(`/tutor/payments/${paymentId}/pdf`, {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Tutorz_${reference}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true };
    } catch (error) {
        console.error('Tutor class payment PDF download failed', error);
        return { success: false, message: 'Failed to download invoice PDF.' };
    }
};
