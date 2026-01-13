import api from '../../src/axois/axois'

export const getBookingList = async (eventId, params = {}) => {
  try {
    const url = eventId
      ? `/event/event-wise-booked-tickets/${encodeURIComponent(
          String(eventId)
        )}`
      : `/event/event-wise-booked-tickets`
    const response = await api.get(url, { params })
    return response.data
  } catch (error) {
    console.error('Error fetching event booked tickets:', error)
    throw error
  }
}

export const downloadBookingReceipt = async (bookingId, eventId) => {
  try {
    const idStr = String(bookingId || '').trim()
    const eidStr = String(eventId || '').trim()
    const url = eidStr
      ? `/event/download-ticket/${encodeURIComponent(
          idStr
        )}?eventId=${encodeURIComponent(eidStr)}`
      : `/event/download-ticket/${encodeURIComponent(idStr)}`
    const response = await api.get(url, { responseType: 'blob' })
    return response.data
  } catch (error) {
    console.error('Error downloading booking receipt:', error)
    throw error
  }
}

export const getActivityBookedTickets = async (activityId, params = {}) => {
  try {
    const response = await api.get(`activity-type/get-all-activity-bookings`, {
      params
    })
    return response.data
  } catch (error) {
    console.error('Error fetching activity bookings:', error)
    throw error
  }
}

export const eventReferralReport = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`event/get-all-referral-events`, {
      params: { page, limit }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching event referral report:', error)
    throw error
  }
}
export const activityReferralReport = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/user-activity/get-all-referral-activities`, {
      params: { page, limit }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching activity referral report:', error)
    throw error
  }
}

export const getAllEsimBookingList = async (params = {}) => {
  try {
    const response = await api.get(`/sochitel/esim-order-list`, { params })
    return response.data
  } catch (error) {
    console.error('Error fetching all esim booking list:', error)
    throw error
  }
}
