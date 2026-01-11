import api from '@/src/axois/axois'

export const getInnerCms = async () => {
  try {
    const response = await api.get('/inner-cms/get-inner-cms')
    return response.data
  } catch (error) {
    console.error('Error fetching inner cms:', error)
    throw error
  }
}

export const createUpdateInnerCms = async payload => {
  try {
    const response = await api.post(
      '/inner-cms/create-or-update-data',
      payload
    )
    return response.data
  } catch (error) {
    console.error('Error creating/updating inner cms:', error)
    throw error
  }
}
