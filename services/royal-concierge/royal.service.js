import api from '@/src/axois/axois'

export const getRoyalBookingList = async () => {
  try {
    const response = await api.get('rc/royal-booking-list')
    return response.data
  } catch (error) {
    console.error('Error fetching contacts:', error)
    throw error
  }
}
