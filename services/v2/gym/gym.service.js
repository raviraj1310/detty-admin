import api from '@/src/axois/axois'

export const getAllGyms = async (page, limit, params) => {
  try {
    const response = await api.get('/gym/get-all-gyms', { params })
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching gyms:', error)
    throw error
  }
}
