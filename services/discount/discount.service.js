import api from '../../src/axois/axois'

export const getAllEventDiscount = async () => {
  try {
    const response = await api.get(`/event/get-coupon-by-event-id`)
    return response.data
  } catch (error) {
    console.error('Error fetching event wise discount data:', error)
    throw error
  }
}
export const getEventWiseDiscountByEventId = async eventId => {
  try {
    const response = await api.get(`/event/get-coupon-by-event-id/${eventId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching event wise discount data:', error)
    throw error
  }
}

export const createDiscount = async discountData => {
  try {
    const response = await api.post('/event/create-event-coupon', discountData)
    return response.data
  } catch (error) {
    console.error('Error creating discount:', error)
    throw error
  }
}

export const getDiscountById = async discountId => {
  try {
    const response = await api.get(`/event/get-single-coupon/${discountId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching discount data:', error)
    throw error
  }
}

export const updateDiscount = async (discountId, discountData) => {
  try {
    const response = await api.put(
      `/event/update-event-coupon/${discountId}`,
      discountData
    )
    return response.data
  } catch (error) {
    console.error('Error updating discount:', error)
    throw error
  }
}

export const deleteDiscount = async discountId => {
  try {
    const response = await api.delete(
      `/event/delete-event-coupon/${discountId}`
    )
    return response.data
  } catch (error) {
    console.error('Error deleting discount:', error)
    throw error
  }
}

export const getEventList = async () => {
  try {
    const response = await api.get('/event/get-all-events')
    return response.data
  } catch (error) {
    console.error('Error fetching event list:', error)
    throw error
  }
}

// Activity coupons
export const createActivityCoupon = async couponData => {
  try {
    const response = await api.post('/activity-type/coupon', couponData)
    return response.data
  } catch (error) {
    console.error('Error creating activity coupon:', error)
    throw error
  }
}

export const getActivityCouponById = async couponId => {
  try {
    const response = await api.get(`/activity-type/coupon/activity/${couponId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching activity coupon:', error)
    throw error
  }
}

export const getAllDiscount = async () => {
  try {
    const response = await api.get(`/activity-type/coupon/activity`)
    return response.data
  } catch (error) {
    console.error('Error fetching activity coupon:', error)
    throw error
  }
}
export const getActivityWiseDiscount = async activityId => {
  try {
    const response = await api.get(
      `/activity-type/coupon/activity/${activityId}`
    )
    return response.data
  } catch (error) {
    console.error('Error fetching activity coupon:', error)
    throw error
  }
}

export const updateActivityCoupon = async (couponId, couponData) => {
  try {
    const response = await api.put(
      `/activity-type/coupon/${couponId}`,
      couponData
    )
    return response.data
  } catch (error) {
    console.error('Error updating activity coupon:', error)
    throw error
  }
}

export const deleteActivityCoupon = async couponId => {
  try {
    const response = await api.delete(`/activity-type/coupon/${couponId}`)
    return response.data
  } catch (error) {
    console.error('Error deleting activity coupon:', error)
    throw error
  }
}

// Merchadise discount
export const createMerchadiseCoupon = async couponData => {
  try {
    const response = await api.post('/merchandise/create-discount', couponData)
    return response.data
  } catch (error) {
    console.error('Error creating merchandise coupon:', error)
    throw error
  }
}

export const getMerchadiseCoupons = async () => {
  try {
    const response = await api.get(`/merchandise/get-all-discounts`)
    return response.data
  } catch (error) {
    console.error('Error fetching merchandise coupon:', error)
    throw error
  }
}

export const getMerchadiseCouponById = async couponId => {
  try {
    const response = await api.get(
      `/merchandise/get-discount-by-id/${couponId}`
    )
    return response.data
  } catch (error) {
    console.error('Error fetching merchandise coupon:', error)
    throw error
  }
}

export const getProductWiseDiscount = async productId => {
  try {
    const response = await api.get(`/merchandise/get-discount/${productId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching product wise discount:', error)
    throw error
  }
}

export const updateMerchadiseCoupon = async (couponId, couponData) => {
  try {
    const response = await api.put(
      `/merchandise/update-discount/${couponId}`,
      couponData
    )
    return response.data
  } catch (error) {
    console.error('Error updating merchandise coupon:', error)
    throw error
  }
}

export const deleteMerchadiseCoupon = async couponId => {
  try {
    const response = await api.delete(
      `/merchandise/delete-discount/${couponId}`
    )
    return response.data
  } catch (error) {
    console.error('Error deleting merchandise coupon:', error)
    throw error
  }
}
