import api from '@/src/axois/axois'

export const getLeadwayList = async () => {
  try {
    const response = await api.get('/leadway/get-all-plan')
    return response.data
  } catch (error) {
    console.error('Error fetching leadway requests:', error)
    throw error
  }
}
