import api from '@/src/axois/axois'

export const getRoles = async () => {
  try {
    const res = await api.get('/role/get-all-roles')
    return res
  } catch (error) {
    console.error('Error fetching roles:', error)
    throw error
  }
}

export const createRole = async roleData => {
  try {
    const res = await api.post('/role/store-role', roleData)
    return res
  } catch (error) {
    console.error('Error creating role:', error)
    throw error
  }
}

export const getRoleById = async roleId => {
  try {
    const res = await api.get(`/role/get-role-by-id/${roleId}`)
    return res
  } catch (error) {
    console.error('Error fetching role by ID:', error)
    throw error
  }
}

export const updateRole = async (roleId, roleData) => {
  try {
    const res = await api.put(`/role/update-role/${roleId}`, roleData)
    return res
  } catch (error) {
    console.error('Error updating role:', error)
    throw error
  }
}

export const deleteRole = async roleId => {
  try {
    const res = await api.delete(`/role/delete-role/${roleId}`)
    return res
  } catch (error) {
    console.error('Error deleting role:', error)
    throw error
  }
}
