import api from '@/src/axois/axois'

export const getMedOrderList = async (params = {}) => {
  try {
    const response = await api.get('med/get-all-med-orders', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching med orders:', error)
    throw error
  }
}
