import apiClient from './apiClient';

export const systemService = {
    downloadUserQrPdf: async (userId) => {
        try {
            const response = await apiClient.get(`/system/users/${userId}/qr-pdf`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (err) {
            console.error('Download QR PDF error:', err);
            throw new Error('Failed to download QR code PDF.');
        }
    }
};

export default systemService;
