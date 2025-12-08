import api from '@/src/axois/axois'

export const createStayPromoBanner = async payload => {
  try {
    const isFormData =
      typeof FormData !== 'undefined' && payload instanceof FormData
    const response = await api.post(
      '/stay-banner/store-stay-banner',
      payload,
      isFormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : undefined
    )
    return response.data
  } catch (error) {
    console.error('Error creating promo banner:', error)
    throw error
  }
}

export const getAllStayPromoBanners = async () => {
  try {
    const response = await api.get('/stay-banner/get-all-stay-banner')
    return response.data
  } catch (error) {
    console.error('Error fetching promo banners:', error)
    throw error
  }
}

export const getSingleStayBanner = async id => {
  try {
    const response = await api.get(`/stay-banner/get-single-stay-banner/${id}`)
    return response.data
  } catch (error) {
    console.error('Error fetching single promo banner:', error)
    throw error
  }
}

export const updateStayPromoBanner = async (id, payload) => {
  try {
    const isFormData =
      typeof FormData !== 'undefined' && payload instanceof FormData
    const response = await api.put(
      `/stay-banner/update-stay-banner/${id}`,
      payload,
      isFormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : undefined
    )
    return response.data
  } catch (error) {
    console.error('Error updating promo banner:', error)
    throw error
  }
}

export const deleteStayPromoBanner = async id => {
  try {
    const response = await api.delete(`/stay-banner/delete-stay-banner/${id}`)
    return response.data
  } catch (error) {
    console.error('Error deleting promo banner:', error)
    throw error
  }
}
