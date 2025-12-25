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
