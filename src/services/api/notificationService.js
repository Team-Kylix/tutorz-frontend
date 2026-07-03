import apiClient from './apiClient';

let notificationsCache = null;

export const clearNotificationsCache = () => {
  notificationsCache = null;
};

/**
 * Fetches the latest 50 notifications for the logged-in user.
 */
export const fetchNotifications = async (bypassCache = false) => {
  if (!bypassCache && notificationsCache) return notificationsCache;
  
  const endpoint = bypassCache ? `/notification?_t=${Date.now()}` : '/notification';
  const response = await apiClient.get(endpoint);
  
  notificationsCache = response.data;
  return response.data;
};

/**
 * Marks a specific notification as read.
 */
export const markAsRead = async (notificationId) => {
  const response = await apiClient.put(`/notification/${notificationId}/read`);
  clearNotificationsCache();
  return response.data;
};

/**
 * Marks all notifications for the logged-in user as read.
 */
export const markAllAsRead = async () => {
  const response = await apiClient.put('/notification/read-all');
  clearNotificationsCache();
  return response.data;
};
