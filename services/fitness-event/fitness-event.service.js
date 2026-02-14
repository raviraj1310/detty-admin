import { apiv2 } from '@/src/axois/axois'

export const getAllFitnessEvent = async () => {
  try {
    const response = await apiv2.get('/fitness-event/get-all-fitness-events')
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const createFitnessEvent = async data => {
  try {
    const response = await apiv2.post(
      '/fitness-event/create-fitness-event',
      data
    )
    return response.data
  } catch (error) {
    const errData = error?.response?.data || {
      success: false,
      message: error?.message || 'Request failed'
    }
    return errData
  }
}

export const getFitnessEventById = async id => {
  try {
    const response = await apiv2.get(
      `/fitness-event/get-fitness-event-by-id/${id}`
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const updateFitnessEvent = async (id, data) => {
  try {
    const response = await apiv2.put(
      `/fitness-event/update-fitness-events/${id}`,
      data
    )
    return response.data
  } catch (error) {
    const errData = error?.response?.data || {
      success: false,
      message: error?.message || 'Request failed'
    }
    return errData
  }
}

export const deleteFitnessEvent = async id => {
  try {
    const response = await apiv2.delete(
      `/fitness-event/delete-fitness-event/${id}`
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const activeInactiveFitnessEvent = async (id, data) => {
  try {
    const response = await apiv2.put(
      `/fitness-event/active-inactive-fitness-event/${id}`,
      data
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const getCertificateTemplate = async () => {
  try {
    const response = await apiv2.get('/fitness-event/get-certificate-list')
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const getHostList = async () => {
  try {
    const response = await apiv2.get('/fitness-event/get-host-list')
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const createFitnessEventPass = async data => {
  try {
    const response = await apiv2.post('/fitness-event/create-event-pass', data)
    return response.data
  } catch (error) {
    const errData = error?.response?.data || {
      success: false,
      message: error?.message || 'Request failed'
    }
    return errData
  }
}

export const getEventPassList = async fitnessEventId => {
  try {
    const response = await apiv2.get(
      `/fitness-event/get-event-pass/${fitnessEventId}`
    )
    return response.data
  } catch (error) {
    const errData = error?.response?.data || {
      success: false,
      message: error?.message || 'Request failed'
    }
    return errData
  }
}

export const getEventPassById = async eventPassId => {
  try {
    const response = await apiv2.get(
      `/fitness-event/get-event-pass/${eventPassId}`
    )
    return response.data
  } catch (error) {
    const errData = error?.response?.data || {
      success: false,
      message: error?.message || 'Request failed'
    }
    return errData
  }
}

export const updateEventPass = async (eventPassId, data) => {
  try {
    const response = await apiv2.put(
      `/fitness-event/update-event-pass/${eventPassId}`,
      data
    )
    return response.data
  } catch (error) {
    const errData = error?.response?.data || {
      success: false,
      message: error?.message || 'Request failed'
    }
    return errData
  }
}

export const deleteEventPass = async eventPassId => {
  try {
    const response = await apiv2.delete(
      `/fitness-event/delete-event-pass/${eventPassId}`
    )
    return response.data
  } catch (error) {
    const errData = error?.response?.data || {
      success: false,
      message: error?.message || 'Request failed'
    }
    return errData
  }
}

export const activeInactiveEventPass = async (eventPassId, data) => {
  try {
    const response = await apiv2.put(
      `/fitness-event/active-inactive-event-pass/${eventPassId}`,
      data
    )
    return response.data
  } catch (error) {
    const errData = error?.response?.data || {
      success: false,
      message: error?.message || 'Request failed'
    }
    return errData
  }
}
