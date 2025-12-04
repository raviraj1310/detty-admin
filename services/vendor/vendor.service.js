import api from '@/src/axois/axois'

export const registerVendor = async payload => {
  try {
    const response = await api.post('/vendor/register-vendor', payload)
    return response.data
  } catch (error) {
    console.error('Error registering vendor:', error)
    throw error
  }
}

export const getVendors = async (params = {}) => {
  try {
    const response = await api.get('/vendor/get-vendor-list', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching vendors:', error)
    throw error
  }
}