import api from '@/src/axois/axois'

const getUserIdFromStorage = () => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage?.getItem('userId') || null
  } catch (_) {
    return null
  }
}

export const getUsers = async (params = {}, signal) => {
  try {
    const config = { params }
    if (signal) config.signal = signal
    const response = await api.get('/user/get-all-users', config)
    return response.data
  } catch (error) {
    if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
      console.error('Error fetching users:', error)
    }
    throw error
  }
}
export const changeUserStatus = async (userId, status) => {
  try {
    const response = await api.put(`/user/change-status/${userId}`, { status })
    return response.data
  } catch (error) {
    console.error('Error changing user status:', error)
    throw error
  }
}

export const getUserWithProfile = async userId => {
  try {
    const response = await api.get(`/user/get-user-with-profile/${userId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching user with profile:', error)
    throw error
  }
}

export const getAllEventBookings = async userId => {
  try {
    const response = await api.get(`/user-event/my-bookings/${userId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching activity bookings:', error)
    throw error
  }
}
export const getAllActivityBookings = async userId => {
  try {
    const response = await api.get(`/user-activity/get-user-bookings/${userId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching activity bookings:', error)
    throw error
  }
}

export const getAllUsersWallet = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`wallet/get-all-users-wallet`, {
      params: { page, limit }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching user wallet history:', error)
    throw error
  }
}

export const getUserWallet = async userId => {
  try {
    // Ensure userId is a string and properly encoded
    const userIdStr = String(userId || '').trim()
    if (!userIdStr) {
      throw new Error('User ID is required')
    }
    const response = await api.get(`wallet/get-my-passbook/${userIdStr}`)
    return response.data
  } catch (error) {
    console.error('Error fetching user wallet history:', error)
    throw error
  }
}

// user wise bookings
// event
export const getAllBookings = async userId => {
  try {
    const response = await api.get(`/user/get-user-wise-bookings/${userId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching all bookings:', error)
    throw error
  }
}
// activity
export const getUserActivityTicketList = async id => {
  try {
    const userId = id || getUserIdFromStorage()
    if (!userId) return []
    const response = await api.get(`/user-activity/get-user-bookings/${userId}`)
    return response.data
  } catch (error) {
    return []
  }
}

// merchandise
export const getMyOrders = async id => {
  try {
    const userId = id || getUserIdFromStorage()
    if (!userId) return []
    const response = await api.get(`/product/get-my-orders/${userId}`)
    return response.data
  } catch (error) {
    console.log('error', error)
    return []
  }
}
// esim (internet connectivity)
export const getMyESimOrders = async id => {
  try {
    const userId = id || getUserIdFromStorage()
    if (!userId) return []
    const response = await api.get(`/sochitel/order-list/${userId}`)
    return response.data
  } catch (error) {
    return []
  }
}

// Accommodation
export const getMyStayBookings = async id => {
  const userId = id || getUserIdFromStorage()
  if (!userId) return []
  try {
    const response = await api.get(`/stay/get-my-stay-bookings/${userId}`)
    return response.data
  } catch (error) {
    console.error('GET MY STAY BOOKINGS ERROR:', error)
    throw error
  }
}

// Med Plus
export const getMyMedOrders = async id => {
  try {
    const userId = id || getUserIdFromStorage()
    if (!userId) return []
    const response = await api.get(`/med/my-med-orders/${userId}`)
    // Handle response structure: { success: true, data: [...] }
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      return response.data.data
    }
    // Fallback: if data is directly an array
    if (Array.isArray(response?.data)) {
      return response.data
    }
    // Fallback: if data.data exists
    if (Array.isArray(response?.data?.data)) {
      return response.data.data
    }
    return []
  } catch (error) {
    console.error('Error fetching Med Plus orders:', error)
    return []
  }
}

// Royal concierge
export const myRoyalBookings = async id => {
  try {
    const userId = id || getUserIdFromStorage()
    if (!userId) return []

    const res = await api.get(`/rc/my-royal-bookings/${userId}`)
    return res.data
  } catch (err) {
    return err?.response?.data
  }
}

// ride
export const getMyRideBookings = async id => {
  const userId = id || getUserIdFromStorage()
  if (!userId) {
    throw new Error('userId is required to fetch ride bookings')
  }

  try {
    const response = await api.get(`/ride/my-rides/${userId}`)
    return response.data
  } catch (error) {
    console.error('Get My Ride Bookings API Error:', error)
    throw error
  }
}

// lead
export const getMyLeadPlans = async id => {
  try {
    const userId = id || getUserIdFromStorage()
    if (!userId) return []
    const response = await api.get(`/leadway/get-my-plan/${userId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching my lead plans:', error)
    throw error
  }
}

export const getActiveUsers = async (page = 1, limit = 50) => {
  try {
    const response = await api.get(`/user/get-active-users`, {
      params: { page, limit }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching active users:', error)
    throw error
  }
}
export const getInactiveUsers = async (page = 1, limit = 20) => {
  try {
    const response = await api.get(
      `/user/get-inactive-users?page=${page}&limit=${limit}`
    )
    return response.data
  } catch (error) {
    console.error('Error fetching inactive users:', error)
    throw error
  }
}

export const downloadActiveExcel = async () => {
  try {
    const response = await api.get(`/user/get-active-users-download`, {
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.error('Error downloading active users Excel:', error)
    throw error
  }
}

export const downloadInactiveExcel = async () => {
  try {
    const response = await api.get(`/user/get-inactive-users-download`, {
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.error('Error downloading inactive users Excel:', error)
    throw error
  }
}

export const getUserList = async () => {
  try {
    const response = await api.get(`/user/get-all-user-list`)
    return response.data
  } catch (error) {
    console.error('Error fetching user list:', error)
    throw error
  }
}

export const getUserAnalysis = async (params = {}) => {
  try {
    const response = await api.get('/user/user-data-analysis', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching user analysis:', error)
    throw error
  }
}

export const getRegisteredUser = async (params = {}) => {
  try {
    const response = await api.get('/user/get-registered-users', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching registered user:', error)
    throw error
  }
}

export const downloadRegisteredExcel = async (params = {}) => {
  try {
    const response = await api.get(`/user/download-registered-users`, {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.error('Error downloading registered users Excel:', error)
    throw error
  }
}
export const getManuallyRegisteredUser = async (params = {}) => {
  try {
    const response = await api.get('/user/get-manually-registered-users', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching manually registered user:', error)
    throw error
  }
}

export const downloadManuallyRegisteredExcel = async (params = {}) => {
  try {
    const response = await api.get(`/user/download-manually-registered-users`, {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.error('Error downloading registered users Excel:', error)
    throw error
  }
}
export const getDumpedUserProvided = async (params = {}) => {
  try {
    const response = await api.get('/user/get-dumped-users-provided', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching manually registered user:', error)
    throw error
  }
}

export const downloadDumpedUserProvided = async (params = {}) => {
  try {
    const response = await api.get(`/user/download-dumped-users-provided`, {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.error('Error downloading registered users Excel:', error)
    throw error
  }
}
export const getEffectiveUsers = async (params = {}) => {
  try {
    const response = await api.get('/user/get-effective-users', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching manually registered user:', error)
    throw error
  }
}

export const downloadEffectiveUsers = async (params = {}) => {
  try {
    const response = await api.get(`/user/download-effective-users`, {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.error('Error downloading registered users Excel:', error)
    throw error
  }
}
export const getSuccessfulDumped = async (params = {}) => {
  try {
    const response = await api.get('/user/get-successful-dumped-users', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching successful dumped user:', error)
    throw error
  }
}

export const downloadSuccessfulDumped = async (params = {}) => {
  try {
    const response = await api.get(`/user/download-successful-dumped-users`, {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.error('Error downloading successful dumped users Excel:', error)
    throw error
  }
}
export const getIncompleteDumped = async (params = {}) => {
  try {
    const response = await api.get('/user/get-incomplete-dumped-users', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching incomplete dumped user:', error)
    throw error
  }
}

export const downloadIncompleteDumped = async (params = {}) => {
  try {
    const response = await api.get(`/user/download-incomplete-dumped-users`, {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.error('Error downloading incomplete dumped users Excel:', error)
    throw error
  }
}
export const getSuccessPasswordReset = async (params = {}) => {
  try {
    const response = await api.get('/user/get-success-password-reset', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching incomplete dumped user:', error)
    throw error
  }
}

export const downloadSuccessPasswordReset = async (params = {}) => {
  try {
    const response = await api.get(`/user/download-success-password-reset`, {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.error('Error downloading incomplete dumped users Excel:', error)
    throw error
  }
}
export const getIncompletePasswordReset = async (params = {}) => {
  try {
    const response = await api.get('/user/get-incomplete-password-reset', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching incomplete dumped user:', error)
    throw error
  }
}

export const downloadIncompletePasswordReset = async (params = {}) => {
  try {
    const response = await api.get(`/user/download-incomplete-password-reset`, {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.error('Error downloading incomplete dumped users Excel:', error)
    throw error
  }
}
export const getDuplicateUsers = async (params = {}) => {
  try {
    const response = await api.get('/user/get-duplicate-users', {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching incomplete dumped user:', error)
    throw error
  }
}

export const downloadDuplicateUsers = async (params = {}) => {
  try {
    const response = await api.get(`/user/download-duplicate-users`, {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.error('Error downloading incomplete dumped users Excel:', error)
    throw error
  }
}
