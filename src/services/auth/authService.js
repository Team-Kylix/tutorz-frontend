import apiClient from '../api/apiClient';
import { store } from '../../store'; 

/**Calls the backend API to register a new user.
 * @param {object} registrationData - The complete data object from the multi-step form.
 * @returns {Promise<object>} The AuthResponse object from the backend.
 */
export const register = async (registrationData) => {
  try {
    // This sends a POST request to 'https://localhost:7010/api/auth/register'
    // The body (registrationData) must match your RegisterRequest.cs DTO
    
    // We pass the whole object directly
    const response = await apiClient.post('/auth/register', registrationData);
    
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
        const response = await apiClient.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
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
    const response = await apiClient.post('/auth/login', {
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
        const response = await apiClient.post('/auth/social-login', payload);
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Social login failed.');
    }
};

/**
 * Checks if a user exists and returns limited details (Name, Masked Phone)
 * to verify identity.
 */
export const checkUserStatus = async (identifier) => {
    try {
        // Backend should return: { exists: bool, name: string, phoneNumber: string }
        const response = await apiClient.post('/auth/check-status', { identifier });
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
        const response = await apiClient.post('/auth/send-otp', { identifier });
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
        const response = await apiClient.post('/auth/verify-otp', { identifier, otp });
        return response.data; // Should return success: true
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Invalid OTP.');
    }
};

export const forgotPassword = async (email) => {
    try {
        const response = await apiClient.post('/auth/forgot-password', { email });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to send request.');
    }
};

export const resetPassword = async (token, newPassword) => {
    try {
        const response = await apiClient.post('/auth/reset-password', { token, newPassword });
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
        const response = await apiClient.post('/auth/register-sibling', siblingData);
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Sibling registration failed.');
    }
};
