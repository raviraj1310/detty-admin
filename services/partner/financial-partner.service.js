import api from '../../src/axois/axois'

export const getFinancialPartnerList = async (params = {}) => {
  try {
    const response = await api.get(
      '/financial-partner/get-financial-partners',
      {
        params
      }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching financial partner list:', error)
    throw error
  }
}

export const createFinancialPartner = async (data = {}) => {
  try {
    const response = await api.post(
      '/financial-partner/create-financial-partner',
      data
    )
    return response.data
  } catch (error) {
    console.error('Error creating financial partner:', error)
    throw error
  }
}

export const getFinancialPartnerById = async (id = '') => {
  try {
    const response = await api.get(
      `/financial-partner/get-financial-partner/${id}`
    )
    return response.data
  } catch (error) {
    console.error('Error fetching financial partner:', error)
    throw error
  }
}

export const updateFinancialPartner = async (id = '', data = {}) => {
  try {
    const response = await api.put(
      `/financial-partner/update-financial-partner/${id}`,
      data
    )
    return response.data
  } catch (error) {
    console.error('Error updating financial partner:', error)
    throw error
  }
}

export const deleteFinancialPartner = async (id = '') => {
  try {
    const response = await api.delete(
      `/financial-partner/delete-financial-partner/${id}`
    )
    return response.data
  } catch (error) {
    console.error('Error deleting financial partner:', error)
    throw error
  }
}
