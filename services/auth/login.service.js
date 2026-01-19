import api from '@/src/axois/axois'

export const loginUser = async payload => {
  try {
    const response = await api.post('/auth/login', payload)
    return response.data
  } catch (error) {
    console.error('Error logging in:', error)
    throw error
  }
}

export const getLoginUser = async userId => {
  try {
    const response = await api.get(`/admin/get-user-by-id/${userId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching login user:', error)
    throw error
  }
}

export const updateLoginUser = async (userId, payload) => {
  try {
    const response = await api.put(
      `/admin/update-user-by-id/${userId}`,
      payload
    )
    return response.data
  } catch (error) {
    console.error('Error updating login user:', error)
    throw error
  }
}

export const changePassword = async (userId, payload) => {
  try {
    const response = await api.put(`/admin/change-password/${userId}`, payload)
    return response.data
  } catch (error) {
    console.error('Error changing password:', error)
    throw error
  }
}

export const dashboardData = async (params = {}) => {
  try {
    const response = await api.get('/admin/dashboard', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    throw error
  }
}
export const dashboardMerchandise = async (params = {}) => {
  try {
    const response = await api.get('/admin/dashboard-merchandise', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    throw error
  }
}
export const dashboardUserActiveInactiveCounts = async (params = {}) => {
  try {
    const response = await api.get('/admin/dashboard-user-count', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    throw error
  }
}

export const transactionCounts = async () => {
  try {
    const response = await api.get('/user/transaction-report')
    return response.data
  } catch (error) {
    console.error('Error fetching transaction counts:', error)
    throw error
  }
}

export const eventCount = async (params = {}) => {
  try {
    const response = await api.get('/admin/dashboard-event-booking', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching event counts:', error)
    throw error
  }
}
export const activityCount = async (params = {}) => {
  try {
    const response = await api.get('/admin/dashboard-activity-booking', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching activity counts:', error)
    throw error
  }
}
export const merchandiseCount = async (params = {}) => {
  try {
    const response = await api.get('/admin/dashboard-merchandise-booking', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching merchandise counts:', error)
    throw error
  }
}
export const accommodationCount = async (params = {}) => {
  try {
    const response = await api.get('/admin/dashboard-stay-booking', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching stay counts:', error)
    throw error
  }
}
export const esimCount = async (params = {}) => {
  try {
    const response = await api.get('/admin/dashboard-esim-booking', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching esim counts:', error)
    throw error
  }
}
export const leadwayCount = async (params = {}) => {
  try {
    const response = await api.get('/admin/dashboard-leadway-booking', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching leadway counts:', error)
    throw error
  }
}
export const rideCount = async (params = {}) => {
  try {
    const response = await api.get('/admin/dashboard-ride-booking', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching ride counts:', error)
    throw error
  }
}
export const royalCount = async (params = {}) => {
  try {
    const response = await api.get('/admin/dashboard-rc-booking', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching royal counts:', error)
    throw error
  }
}
export const medCount = async (params = {}) => {
  try {
    const response = await api.get('/admin/dashboard-med-booking', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching med counts:', error)
    throw error
  }
}
