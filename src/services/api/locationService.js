import apiClient from './apiClient'; 

export const getProvinces = async () => {
    try {
        const response = await apiClient.get('/locations/provinces');
        return response.data;
    } catch (error) {
        console.error("Failed to fetch provinces", error);
        return [];
    }
};

export const getDistricts = async (provinceId) => {
    try {
        const response = await apiClient.get(`/locations/provinces/${provinceId}/districts`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch districts", error);
        return [];
    }
};

export const getCities = async (districtId) => {
    try {
        const response = await apiClient.get(`/locations/districts/${districtId}/cities`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch cities", error);
        return [];
    }
};