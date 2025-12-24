import api from '@/src/axois/axois'

export const getRoyalBookingList = async (params = {}) => {
  try {
    const response = await api.get('rc/royal-booking-list', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching contacts:', error)
    throw error
  }
}
