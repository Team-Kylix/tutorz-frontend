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
export const recordPayment = async (data) => {
    try {
        const response = await apiClient.post('/payment/record', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to record payment' };
    }
};
