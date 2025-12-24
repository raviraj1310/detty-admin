import api from '@/src/axois/axois'

export const getAllRideBookings = async (params = {}) => {
  try {
    const response = await api.get('/ride/get-all-rides-admin', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching ride bookings:', error)
    throw error
  }
}
