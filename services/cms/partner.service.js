import api from '@/src/axois/axois'

export const getPartnerWithUs = async () => {
  try {
    const response = await api.get('/cms/get-become-partner')
    return response.data
  } catch (error) {
    console.error('Error fetching partner with us:', error)
    throw error
  }
}

export const createUpdatePartnerWithUs = async data => {
  try {
    const isFormData =
      typeof FormData !== 'undefined' && data instanceof FormData
    const response = await api.post(
      '/cms/create-or-update-become-partner',
      data,
      isFormData
        ? {
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        : undefined
    )
    return response.data
  } catch (error) {
    console.error('Error creating update partner with us:', error)
    throw error
  }
}
