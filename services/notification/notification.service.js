import api from '@/src/axois/axois'

export const createCustomNotification = async notificationData => {
  try {
    const response = await api.post(
      '/user/send-test-notification',
      notificationData
    )
    return response.data
  } catch (error) {
    throw error
  }
}

export const getNotifications = async (page = 1, limit = 5) => {
  try {
    const response = await api.get(
      `/user/get-all-notifications?page=${page}&limit=${limit}`
    )
    return response?.data?.data || { data: [], pagination: {} }
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return { data: [], pagination: {} }
  }
}
