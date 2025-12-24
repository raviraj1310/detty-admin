import api from '@/src/axois/axois'

export const getLeadwayList = async (params = {}) => {
  try {
    const response = await api.get('/leadway/get-all-plan', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching leadway requests:', error)
    throw error
  }
}
