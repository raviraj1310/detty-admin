import api from '@/src/axois/axois'

export const getMedOrderList = async () => {
  try {
    const response = await api.get('med/get-all-med-orders')
    return response.data
  } catch (error) {
    console.error('Error fetching med orders:', error)
    throw error
  }
}
