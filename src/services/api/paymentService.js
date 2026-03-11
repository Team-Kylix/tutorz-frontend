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
