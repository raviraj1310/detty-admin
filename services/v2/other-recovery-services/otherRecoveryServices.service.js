import { apiv2 } from '@/src/axois/axois'

export const getAllOtherRecoveryServices = async (page, limit, params) => {
  try {
    const response = await apiv2.get('/recovery/get-all-recovery', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching other recovery services:', error)
    throw error
  }
}

export const getOtherRecoveryServiceById = async id => {
  try {
    const response = await apiv2.get(`/recovery/get-recovery/${id}`)
    return response.data
  } catch (error) {
    console.error('Error fetching other recovery service:', error)
    throw error
  }
}

export const createOtherRecoveryService = async data => {
  try {
    const response = await apiv2.post('/recovery/create-recovery', data)
    return response.data
  } catch (error) {
    console.error('Error creating other recovery service:', error)
    throw error
  }
}

export const updateOtherRecoveryService = async (id, data) => {
  try {
    const response = await apiv2.put(`/recovery/update-recovery/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Error updating other recovery service:', error)
    throw error
  }
}

export const deleteOtherRecoveryService = async id => {
  try {
    const response = await apiv2.delete(`/recovery/delete-recovery/${id}`)
    return response.data
  } catch (error) {
    console.error('Error deleting other recovery service:', error)
    throw error
  }
}

export const deleteOtherRecoveryServiceGallery = async (id, data) => {
  try {
    const response = await apiv2.delete(
      `/recovery/delete-recovery-gallery/${id}`,
      data
    )
    return response.data
  } catch (error) {
    console.error('Error deleting other recovery service gallery:', error)
    throw error
  }
}
export const deleteOtherRecoveryServiceSlot = async (id, data) => {
  try {
    const response = await apiv2.delete(
      `/recovery/delete-recovery-slot/${id}`,
      data
    )
    return response.data
  } catch (error) {
    console.error('Error deleting other recovery service slot:', error)
    throw error
  }
}

export const activeInactiveOtherRecoveryService = async (id, data) => {
  try {
    const response = await apiv2.put(
      `/recovery/change-recovery-status/${id}`,
      data
    )
    return response.data
  } catch (error) {
    console.error('Error active/inactive other recovery service:', error)
    throw error
  }
}

export const getAllOtherRecoveryServiceBookings = async params => {
  try {
    const response = await apiv2.get('/recovery/get-all-recovery-bookings', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching all other recovery service bookings:', error)
    throw error
  }
}

export const getOtherRecoveryServiceBookings = async (serviceId, params) => {
  try {
    const response = await apiv2.get(
      `/recovery/get-recovery-bookings/${serviceId}`,
      { params }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching other recovery service bookings:', error)
    throw error
  }
}

export const getAllSessions = async (serviceId, params = {}) => {
  try {
    const response = await apiv2.get(
      `/recovery/get-all-sessions/${serviceId}`,
      {
        params
      }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching all sessions:', error)
    throw error
  }
}

export const createSession = async data => {
  try {
    const response = await apiv2.post(`/recovery/create-recovery-session`, data)
    return response.data
  } catch (error) {
    console.error('Error creating session:', error)
    throw error
  }
}

export const getRecoverySessionById = async sessionId => {
  try {
    const response = await apiv2.get(`/recovery/get-session/${sessionId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching recovery session:', error)
    throw error
  }
}

export const updateSession = async (sessionId, data) => {
  try {
    const response = await apiv2.put(
      `/recovery/update-recovery-session/${sessionId}`,
      data
    )
    return response.data
  } catch (error) {
    console.error('Error updating recovery session:', error)
    throw error
  }
}

export const updateStatus = async (sessionId, data) => {
  try {
    const response = await apiv2.put(
      `/recovery/change-recovery-session-status/${sessionId}`,
      data
    )
    return response.data
  } catch (error) {
    console.error('Error updating session status:', error)
    throw error
  }
}

export const deleteSession = async sessionId => {
  try {
    const response = await apiv2.delete(
      `/recovery/delete-recovery-session/${sessionId}`
    )
    return response.data
  } catch (error) {
    console.error('Error deleting recovery session:', error)
    throw error
  }
}
