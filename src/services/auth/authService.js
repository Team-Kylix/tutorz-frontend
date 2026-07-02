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

    } catch (error) {
        console.error("Registration error:", error.response?.data || error.message);
        const err = new Error(error.response?.data?.message || 'Registration failed');
        if (error.response) err.response = error.response;
        throw err;
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
 * Checks if a user exists (Mobile OR Email).
 * @param {object} data - { email: string, phoneNumber: string }
 */
export const checkUserStatus = async (data) => {
    try {
        // Backend now expects { email, phoneNumber } in the body
        // Ensure keys match what the Backend DTO expects
        const response = await apiClient.post('/auth/check-status', {
            email: data.email,
            phoneNumber: data.phoneNumber
        });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to check user status.');
    }
};

export const sendRegistrationOtp = async (phoneNumber) => {
    try {
        const response = await apiClient.post('/auth/send-registration-otp', { phoneNumber });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to send registration OTP.');
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

export const forgotPassword = async (identifier) => {
    try {
        const response = await apiClient.post('/auth/forgot-password', { identifier });
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

export const registerSibling = async (siblingData) => {
    try {
        // Matches Backend: [HttpPost("register-sibling")]
        const response = await apiClient.post('/auth/register-sibling', siblingData);
        return response.data;
    } catch (error) {
        console.error("Sibling Registration error:", error.response?.data || error.message);
        const err = new Error(error.response?.data?.message || 'Sibling registration failed');
        if (error.response) err.response = error.response;
        throw err;
    }
};

/**
 * Switches the active student profile (for sibling accounts under the same parent).
 * @param {string} studentId - The target student's GUID.
 * @returns {Promise<object>} Full AuthResponse with new JWT token and all profiles.
 */
export const switchProfile = async (studentId) => {
    try {
        const response = await apiClient.post('/auth/switch-profile', { studentId });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to switch profile.');
    }
};

/**
 * Uploads a profile picture for a specific role and entity.
 */
export const uploadProfilePicture = async (entityId, registrationNumber, role, file) => {
    try {
        const formData = new FormData();
        formData.append('entityId', entityId);
        formData.append('registrationNumber', registrationNumber);
        formData.append('role', role);
        formData.append('file', file);

        const response = await apiClient.post('/auth/profile-picture', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data; // { smallUrl, largeUrl, message }
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to upload profile picture.');
    }
};

// --- CREDENTIAL UPDATES ---

export const requestEmailUpdate = async (newEmail) => {
    try {
        const response = await apiClient.post('/auth/request-email-update', { newIdentifier: newEmail });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to request email update.');
    }
};

export const verifyEmailUpdate = async (newEmail, otp) => {
    try {
        const response = await apiClient.post('/auth/verify-email-update', { newIdentifier: newEmail, otp });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to verify email update.');
    }
};

export const requestMobileUpdate = async (newMobile) => {
    try {
        const response = await apiClient.post('/auth/request-mobile-update', { newIdentifier: newMobile });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to request mobile update.');
    }
};

export const verifyMobileUpdate = async (newMobile, otp) => {
    try {
        const response = await apiClient.post('/auth/verify-mobile-update', { newIdentifier: newMobile, otp });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to verify mobile update.');
    }
};

export const changePassword = async (currentPassword, newPassword) => {
    try {
        const response = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || 'Failed to change password.');
    }
};
