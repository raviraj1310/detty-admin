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

export const createOtherCustomNotification = async notificationData => {
  try {
    const response = await api.post(
      '/custom-notification/create-custom-notification',
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

export const getSendedEmailList = async (
  userNotificationId,
  page = 1,
  limit = 10
) => {
  try {
    const id = encodeURIComponent(String(userNotificationId || '').trim())
    if (!id)
      return {
        data: [],
        pagination: { totalRecords: 0, currentPage: 1, totalPages: 0, limit }
      }
    const response = await api.get(`/user/get-all-email-list/${id}`, {
      params: { page, limit }
    })
    return (
      response?.data?.data || {
        data: [],
        pagination: { totalRecords: 0, currentPage: page, totalPages: 0, limit }
      }
    )
  } catch (error) {
    console.error('Error fetching sended email list:', error)
    return { data: [], pagination: {} }
  }
}
