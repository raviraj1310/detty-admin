import api from '../../src/axois/axois'

export const getAllStates = async (params = {}) => {
  try {
    const response = await api.get('/world/all-states', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching states:', error)
    throw error
  }
}

export const getStateById = async stateId => {
  try {
    const response = await api.get(`/world/get-state-by-id/${stateId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching state:', error)
    throw error
  }
}

export const createState = async stateData => {
  try {
    const response = await api.post('/world/store-state', stateData)
    return response.data
  } catch (error) {
    console.error('Error creating state:', error)
    throw error
  }
}

export const updateState = async (stateId, stateData) => {
  try {
    const response = await api.put(`/world/update-state/${stateId}`, stateData)
    return response.data
  } catch (error) {
    console.error('Error updating state:', error)
    throw error
  }
}

export const deleteState = async stateId => {
  try {
    const response = await api.delete(`/world/delete-state/${stateId}`)
    return response.data
  } catch (error) {
    console.error('Error deleting state:', error)
    throw error
  }
}

export const getStatesByCountryId = async (countryId, params = {}) => {
  try {
    const response = await api.get(
      `/world/get-country-wish-state/${countryId}`,
      { params }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching states by country:', error)
    throw error
  }
}
