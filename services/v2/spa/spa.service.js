import { apiv2 } from '@/src/axois/axois'

export const getAllSpa = async (page, limit, params) => {
  try {
    const response = await apiv2.get('/spa/get-all-spa', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching spas:', error)
    throw error
  }
}

export const getSpaById = async id => {
  try {
    const response = await apiv2.get(`/spa/get-spa-by-id/${id}`)
    return response.data
  } catch (error) {
    console.error('Error fetching spa:', error)
    throw error
  }
}

export const createSpa = async data => {
  try {
    const response = await apiv2.post('/spa/create-spa', data)
    return response.data
  } catch (error) {
    console.error('Error creating spa:', error)
    throw error
  }
}

export const updateSpa = async (id, data) => {
  try {
    const response = await apiv2.put(`/spa/update-spa/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Error updating spa:', error)
    throw error
  }
}

export const deleteSpa = async id => {
  try {
    const response = await apiv2.delete(`/spa/delete-spa/${id}`)
    const data = response.data
    return data
  } catch (error) {
    console.error('Error deleting spa:', error)
    throw error
  }
}

export const activeInactiveSpa = async (id, data) => {
  try {
    const response = await apiv2.put(`/spa/active-inactive-spa/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Error active/inactive spa:', error)
    throw error
  }
}

export const getSpaHostList = async () => {
  try {
    const response = await apiv2.get('/spa/get-spa-host-list')
    return response.data
  } catch (error) {
    console.error('Error fetching spa host list:', error)
    throw error
  }
}

export const deleteSpaGallery = async id => {
  try {
    const response = await apiv2.delete(`/spa/delete-spa-gallery/${id}`)
    return response.data
  } catch (error) {
    console.error('Error deleting spa gallery:', error)
    throw error
  }
}

// access routes

export const getSpaAccess = async spaId => {
  try {
    const response = await apiv2.get(`/spa/get-all-spa-session/${spaId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching spa session:', error)
    throw error
  }
}

export const createSpaAccess = async data => {
  try {
    const response = await apiv2.post(`/spa/create-spa-session`, data)
    return response.data
  } catch (error) {
    console.error('Error creating spa session:', error)
    throw error
  }
}

export const updateSpaAccess = async (id, data) => {
  try {
    const response = await apiv2.put(`/spa/update-spa-session/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Error updating spa session:', error)
    throw error
  }
}

export const deleteSpaAccess = async id => {
  try {
    const response = await apiv2.delete(`/spa/delete-spa-session/${id}`)
    return response.data
  } catch (error) {
    console.error('Error deleting spa session:', error)
    throw error
  }
}

export const activeInactiveSpaAccess = async (id, data) => {
  try {
    const response = await apiv2.put(
      `/spa/active-inactive-spa-session/${id}`,
      data
    )
    return response.data
  } catch (error) {
    console.error('Error active/inactive spa session:', error)
    throw error
  }
}

export const getSpaBookings = async (spaId, params) => {
  try {
    const response = await apiv2.get(`/spa/get-spa-bookings/${spaId}`, {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching spa bookings:', error)
    throw error
  }
}

export const getAllSpaBookings = async params => {
  try {
    const response = await apiv2.get('/spa/get-all-spa-bookings', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching all spa bookings:', error)
    throw error
  }
}
