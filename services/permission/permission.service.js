import api from '@/src/axois/axois'

export const getAllPermissions = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(
      `/permission/get-all-permissions?page=${page}&limit=${limit}`
    )
    return response?.data?.data || []
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return []
  }
}

export const createPermission = async permissionData => {
  try {
    const response = await api.post(
      '/permission/store-permission',
      permissionData
    )
    return response.data
  } catch (error) {
    throw error
  }
}

export const getPermissionById = async permissionId => {
  try {
    const response = await api.get(
      `/permission/get-permission-by-id/${permissionId}`
    )
    return response?.data?.data || {}
  } catch (error) {
    console.error('Error fetching permission:', error)
    return {}
  }
}

export const updatePermission = async (permissionId, permissionData) => {
  try {
    const response = await api.put(
      `/permission/update-permission/${permissionId}`,
      permissionData
    )
    return response.data
  } catch (error) {
    throw error
  }
}

export const deletePermission = async permissionId => {
  try {
    const response = await api.delete(
      `/permission/delete-permission/${permissionId}`
    )
    return response.data
  } catch (error) {
    throw error
  }
}
