import apiClient from './apiClient';
import { API_URLS } from '../../utils/constants';

export const getProvinces = async () => {
    try {
        const response = await apiClient.get(API_URLS.PROVINCES);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch provinces", error);
        return [];
    }
};

export const getDistricts = async (provinceId) => {
    try {
        const response = await apiClient.get(`${API_URLS.PROVINCES}/${provinceId}/districts`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch districts", error);
        return [];
    }
};

export const getCities = async (districtId) => {
    try {
        const response = await apiClient.get(`${API_URLS.DISTRICTS}/${districtId}/cities`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch cities", error);
        return [];
    }
};