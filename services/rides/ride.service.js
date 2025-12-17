import api from '@/src/axois/axois'

export const getAllRideBookings = async () => {
  try {
    const response = await api.get('/ride/get-all-rides')
    return response.data
  } catch (error) {
    console.error('Error fetching ride bookings:', error)
    throw error
  }
}
