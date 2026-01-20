export const decodeJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return {};
    }
};

/**
 * Handles the success response from Google.
 * Extracts user info from the ID token.
 */
export const handleGoogleResponse = (tokenResponse) => {
    return tokenResponse;
};

export const getGoogleUserProfile = async (accessToken) => {
    try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();
        return {
            email: data.email,
            firstName: data.given_name,
            lastName: data.family_name,
            picture: data.picture,
            idToken: null 
        };
    } catch (error) {
        throw new Error("Failed to fetch Google profile");
    }
};