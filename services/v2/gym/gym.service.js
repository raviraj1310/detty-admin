import { apiv2 } from '@/src/axois/axois'

export const getAllGyms = async (page, limit, params) => {
  try {
    const response = await apiv2.get('/gym/get-all-gyms', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching gyms:', error)
    throw error
  }
}

export const getGymById = async id => {
  try {
    const response = await apiv2.get(`/gym/get-gym/${id}`)
    return response.data
  } catch (error) {
    console.error('Error fetching gym:', error)
    throw error
  }
}

export const createGym = async data => {
  try {
    const response = await apiv2.post('/gym/create-gym', data)
    return response.data
  } catch (error) {
    console.error('Error creating gym:', error)
    throw error
  }
}

export const updateGym = async (id, data) => {
  try {
    const response = await apiv2.put(`/gym/update-gym/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Error updating gym:', error)
    throw error
  }
}

export const deleteGym = async id => {
  try {
    const response = await apiv2.delete(`/gym/delete-gym/${id}`)
    return response.data
  } catch (error) {
    console.error('Error deleting gym:', error)
    throw error
  }
}

export const activeInactiveGym = async (id, data) => {
  try {
    const response = await apiv2.put(`/gym/active-inactive-gym/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Error active/inactive gym:', error)
    throw error
  }
}

export const getGymHostList = async () => {
  try {
    const response = await apiv2.get('/gym/get-gym-host-list')
    return response.data
  } catch (error) {
    console.error('Error fetching gym host list:', error)
    throw error
  }
}

export const deleteGymGallery = async id => {
  try {
    const response = await apiv2.delete(`/gym/delete-gym-gallery/${id}`)
    return response.data
  } catch (error) {
    console.error('Error deleting gym gallery:', error)
    throw error
  }
}

// access routes

export const getGymAccess = async gymId => {
  try {
    const response = await apiv2.get(`/gym/get-gym-access-list/${gymId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching gym access:', error)
    throw error
  }
}

export const createGymAccess = async data => {
  try {
    const response = await apiv2.post(`/gym/create-gym-access`, data)
    return response.data
  } catch (error) {
    console.error('Error creating gym access:', error)
    throw error
  }
}

export const getGymAccessById = async accessId => {
  try {
    const response = await apiv2.get(`/gym/get-gym-access/${accessId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching gym access:', error)
    throw error
  }
}

export const updateGymAccess = async (gymId, data) => {
  try {
    const response = await apiv2.put(`/gym/update-gym-access/${gymId}`, data)
    return response.data
  } catch (error) {
    console.error('Error updating gym access:', error)
    throw error
  }
}

export const deleteGymAccess = async (gymId, data) => {
  try {
    const response = await apiv2.delete(`/gym/delete-gym-access/${gymId}`, data)
    return response.data
  } catch (error) {
    console.error('Error deleting gym access:', error)
    throw error
  }
}

export const activeInactiveGymAccess = async (gymId, data) => {
  try {
    const response = await apiv2.put(
      `/gym/active-inactive-gym-access/${gymId}`,
      data
    )
    return response.data
  } catch (error) {
    console.error('Error active/inactive gym access:', error)
    throw error
  }
}

export const getAllGymBookings = async (page, limit, params) => {
  try {
    const response = await apiv2.get('/gym/get-all-gym-bookings', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching gym bookings:', error)
    throw error
  }
}

export const getGymBookingDetail = async bookingId => {
  try {
    const response = await apiv2.get(
      `/wellness/get-gym-booking-detail/${bookingId}`
    )
    return response.data
  } catch (error) {
    console.error('Error fetching gym booking:', error)
    throw error
  }
}

export const getBookingsByGymId = async (page, limit, gymId, search) => {
  try {
    const params = {
      page,
      limit
    }

    if (search) {
      params.search = search
    }

    const response = await apiv2.get(`/gym/get-all-bookings-gym/${gymId}`, {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching gym bookings:', error)
    throw error
  }
}
