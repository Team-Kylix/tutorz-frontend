import apiClient from './apiClient';

/**
 * Fetches the latest 50 notifications for the logged-in user.
 */
export const fetchNotifications = async () => {
  const response = await apiClient.get('/notification');
  return response.data;
};

/**
 * Marks a specific notification as read.
 */
export const markAsRead = async (notificationId) => {
  const response = await apiClient.put(`/notification/${notificationId}/read`);
  return response.data;
};

/**
 * Marks all notifications for the logged-in user as read.
 */
export const markAllAsRead = async () => {
  const response = await apiClient.put('/notification/read-all');
  return response.data;
};
