import { apiv2 } from '@/src/axois/axois'

export const createFood = async data => {
  try {
    const response = await apiv2.post('/food/create-food', data)
    return response.data
  } catch (error) {
    console.error('Error creating food:', error)
    throw error
  }
}

export const getAllFoods = async (page, limit, params) => {
  try {
    const response = await apiv2.get('/food/get-all-foods', { params })
    return response.data
  } catch (error) {
    console.error('Error getting all foods:', error)
    throw error
  }
}

export const getFoodById = async id => {
  try {
    const response = await apiv2.get(`/food/get-food-by-id/${id}`)
    return response.data
  } catch (error) {
    console.error('Error getting food by id:', error)
    throw error
  }
}

export const updateFood = async (id, data) => {
  try {
    const response = await apiv2.put(`/food/update-food/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Error updating food:', error)
    throw error
  }
}

export const deleteFood = async id => {
  try {
    const response = await apiv2.delete(`/food/delete-food/${id}`)
    return response.data
  } catch (error) {
    console.error('Error deleting food:', error)
    throw error
  }
}

export const updateFoodStatus = async (id, data) => {
  try {
    const response = await apiv2.put(`/food/update-food-status/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Error updating food status:', error)
    throw error
  }
}

export const deleteFoodDocument = async documentId => {
  try {
    const response = await apiv2.delete(
      `/food/delete-food-document/${documentId}`
    )
    return response.data
  } catch (error) {
    console.error('Error deleting food document:', error)
    throw error
  }
}

// access apis

export const createFoodAccess = async data => {
  try {
    const response = await apiv2.post('/food/create-prescriptions-access', data)
    return response.data
  } catch (error) {
    console.error('Error creating food access:', error)
    throw error
  }
}

export const getAllPrescriptionsAccess = async (
  foodPrescriptionId,
  page,
  limit,
  params
) => {
  try {
    const response = await apiv2.get(
      `/food/get-food-prescriptions-access/${foodPrescriptionId}`,
      {
        params
      }
    )
    return response.data
  } catch (error) {
    console.error('Error getting all prescriptions access:', error)
    throw error
  }
}

export const getPrescriptionsAccessById = async id => {
  try {
    const response = await apiv2.get(
      `/food/get-food-prescriptions-access-by-id/${id}`
    )
    return response.data
  } catch (error) {
    console.error('Error getting prescriptions access by id:', error)
    throw error
  }
}

export const updatePrescriptionsAccess = async (id, data) => {
  try {
    const response = await apiv2.put(
      `/food/update-food-prescriptions-access/${id}`,
      data
    )
    return response.data
  } catch (error) {
    console.error('Error updating prescriptions access:', error)
    throw error
  }
}

export const deletePrescriptionsAccess = async id => {
  try {
    const response = await apiv2.delete(
      `/food/delete-food-prescriptions-access/${id}`
    )
    return response.data
  } catch (error) {
    console.error('Error deleting prescriptions access:', error)
    throw error
  }
}

export const updatePrescriptionsAccessStatus = async (id, data) => {
  try {
    const response = await apiv2.put(`/food/update-food-prescriptions-access-status/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Error updating prescriptions access status:', error)
    throw error
  }
}