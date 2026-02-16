import apiClient from '../api/apiClient';
import { store } from '../../store';
import { API_URLS } from '../../utils/constants';

/**Calls the backend API to register a new user.
 * @param {object} registrationData - The complete data object from the multi-step form.
 * @returns {Promise<object>} The AuthResponse object from the backend.
 */
export const register = async (registrationData) => {
    try {
        // This sends a POST request to 'https://localhost:7010/api/auth/register'
        // The body (registrationData) must match your RegisterRequest.cs DTO

        // We pass the whole object directly
        const response = await apiClient.post(API_URLS.REGISTER, registrationData);

        // response.data will be the AuthResponse object from your C# backend
        // { userId, email, role, token }
        return response.data;

    } catch (err) {
        // If the API returns an error, throw it
        throw new Error(err.response?.data?.message || 'Registration failed. Please try again.');
    }
};

export const checkEmailExists = async (email) => {
    try {
        const response = await apiClient.get(`${API_URLS.Check_EMAIL}?email=${encodeURIComponent(email)}`);
        return response.data.exists;
    } catch (err) {
        console.error("Email check failed", err);
        return false;
    }
};

/**
 * Calls the backend API to log in a user.
 * (You will need this for your LoginForm)
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} The AuthResponse object from the backend.
 */
export const login = async (identifier, password) => {
    try {
        const response = await apiClient.post(API_URLS.LOGIN, {
            identifier: identifier,
            password
        });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Login failed. Please try again.');
    }
};

/**
 * Calls the backend to perform Social Login or Registration.
 * @param {object} payload - { provider, idToken, role, phoneNumber, firstName, ...others }
 */
export const socialLogin = async (payload) => {
    try {
        // payload matches the Backend SocialLoginRequest DTO
        const response = await apiClient.post(API_URLS.SOCIAL_LOGIN, payload);
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Social login failed.');
    }
};

/**
 * Checks if a user exists (Mobile OR Email).
 * @param {object} data - { email: string, phoneNumber: string }
 */
export const checkUserStatus = async (data) => {
    try {
        // Backend now expects { email, phoneNumber } in the body
        // Ensure keys match what the Backend DTO expects
        const response = await apiClient.post(API_URLS.CHECK_STATUS, {
            email: data.email,
            phoneNumber: data.phoneNumber
        });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to check user status.');
    }
};

/**
 * Sends an OTP to the registered email of the identifier.
 */
export const sendOtp = async (identifier) => {
    try {
        const response = await apiClient.post(API_URLS.SEND_OTP, { identifier });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to send OTP.');
    }
};

/**
 * Verifies the OTP.
 */
export const verifyOtp = async (identifier, otp) => {
    try {
        const response = await apiClient.post(API_URLS.VERIFY_OTP, { identifier, otp });
        return response.data; // Should return success: true
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Invalid OTP.');
    }
};

export const forgotPassword = async (email) => {
    try {
        const response = await apiClient.post(API_URLS.FORGOT_PASSWORD, { email });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to send request.');
    }
};

export const resetPassword = async (token, newPassword) => {
    try {
        const response = await apiClient.post(API_URLS.RESET_PASSWORD, { token, newPassword });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to reset password.');
    }
};

/**
 * Registers a new student under an existing parent account.
 * @param {object} siblingData - { identifier, firstName, lastName, grade, ... }
 */
export const registerSibling = async (siblingData) => {
    try {
        // Matches Backend: [HttpPost("register-sibling")]
        const response = await apiClient.post(API_URLS.REGISTER_SIBLING, siblingData);
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Sibling registration failed.');
    }
};

