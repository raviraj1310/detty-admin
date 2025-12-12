import api from '@/src/axois/axois'

export const getRequests = async () => {
  try {
    const response = await api.get('/user/get-deactivation-requests')
    return response.data
  } catch (error) {
    console.error('Error fetching contacts:', error)
    throw error
  }
}

export const deleteApproval = async id => {
  try {
    const response = await api.delete(
      `/user/approve-deactivation-request/${id}`
    )
    return response.data
  } catch (error) {
    console.error('Error approving deactivation:', error)
    throw error
  }
}
