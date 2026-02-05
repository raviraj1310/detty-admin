import api from '@/src/axois/axois'

export const getAllAdminUsers = async (page = 1, limit = 10, search = '') => {
  try {
    const response = await api.get('/user-role/get-all-users', {
      params: { page, limit, search }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching admin users:', error)
    throw error
  }
}

export const createAdminUser = async userData => {
  try {
    const response = await api.post('/user-role/store-user-role', userData)
    return response.data
  } catch (error) {
    console.error('Error creating admin user:', error)
    throw error
  }
}

export const updateAdminUser = async (userId, userData) => {
  try {
    const response = await api.put(
      `/user-role/update-user-role/${userId}`,
      userData
    )
    return response.data
  } catch (error) {
    console.error('Error updating admin user:', error)
    throw error
  }
}

export const deleteAdminUser = async userId => {
  try {
    const response = await api.delete(`/user-role/delete-user-role/${userId}`)
    return response.data
  } catch (error) {
    console.error('Error deleting admin user:', error)
    throw error
  }
}

export const getAdminUserById = async userId => {
  try {
    const response = await api.get(`/user-role/get-user-by-id/${userId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching admin user:', error)
    throw error
  }
}
