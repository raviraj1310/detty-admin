import api from '@/src/axois/axois'

export const loginUser = async payload => {
  try {
    const response = await api.post('/auth/login', payload)
    return response.data
  } catch (error) {
    console.error('Error logging in:', error)
    throw error
  }
}

export const getLoginUser = async userId => {
  try {
    const response = await api.get(`/admin/get-user-by-id/${userId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching login user:', error)
    throw error
  }
}

export const updateLoginUser = async (userId, payload) => {
  try {
    const response = await api.put(
      `/admin/update-user-by-id/${userId}`,
      payload
    )
    return response.data
  } catch (error) {
    console.error('Error updating login user:', error)
    throw error
  }
}

export const changePassword = async (userId, payload) => {
  try {
    const response = await api.put(`/admin/change-password/${userId}`, payload)
    return response.data
  } catch (error) {
    console.error('Error changing password:', error)
    throw error
  }
}

export const dashboardData = async () => {
  try {
    const response = await api.get('/admin/dashboard')
    return response.data
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    throw error
  }
}
