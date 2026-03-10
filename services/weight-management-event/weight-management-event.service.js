import { apiv2 } from '@/src/axois/axois'

export const getAllWeightManagementEvents = async () => {
  try {
    const response = await apiv2.get(
      '/weight-management-event/get-weight-management-event'
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const createWeightManagementEvent = async data => {
  try {
    const response = await apiv2.post(
      '/weight-management-event/create-weight-management-event',
      data
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const getWeightManagementEventById = async id => {
  try {
    const response = await apiv2.get(
      `/weight-management-event/get-weight-management-event-by-id/${id}`
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const updateWeightManagementEvent = async (id, data) => {
  try {
    const response = await apiv2.put(
      `/weight-management-event/update-weight-management-event/${id}`,
      data
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const deleteWeightManagementEvent = async id => {
  try {
    const response = await apiv2.delete(
      `/weight-management-event/delete-weight-management-event/${id}`
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const updateWeightManagementEventStatus = async (id, status) => {
  try {
    const response = await apiv2.put(
      `/weight-management-event/active-inactive-weight-management-event/${id}`,
      { status }
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const getAllCertificates = async () => {
  try {
    const response = await apiv2.get(
      '/weight-management-event/get-certificates-list'
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

// passes
export const getAllPasses = async weightManagementEventId => {
  try {
    const response = await apiv2.get(
      `/weight-management-event/get-weight-management-event-pass/${weightManagementEventId}`
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const createWeightManagementEventPass = async data => {
  try {
    const response = await apiv2.post(
      `/weight-management-event/create-weight-management-event-pass`,
      data
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const getWeightManagementEventPassById = async passId => {
  try {
    const response = await apiv2.get(
      `/weight-management-event/get-weight-management-event-pass-by-id/${passId}`
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const updateWeightManagementEventPass = async (passId, data) => {
  try {
    const response = await apiv2.put(
      `/weight-management-event/update-weight-management-event-pass/${passId}`,
      data
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const deleteWeightManagementEventPass = async passId => {
  try {
    const response = await apiv2.delete(
      `/weight-management-event/delete-weight-management-event-pass/${passId}`
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const activeInactiveWeightManagementEventPass = async (
  passId,
  status
) => {
  try {
    const response = await apiv2.put(
      `/weight-management-event/active-inactive-weight-management-event-pass/${passId}`,
      { status }
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}
