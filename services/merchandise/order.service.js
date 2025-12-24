import api from '../../src/axois/axois'

export const getAllOrders = async (params = {}) => {
  try {
    const res = await api.get('/product/get-all-orders', { params })
    return res.data
  } catch (error) {
    console.log(error)
  }
}

export const downloadOrderReceipt = async orderId => {
  try {
    const idStr = String(orderId || '').trim()
    const res = await api.get(
      `/product/download-order-pdf/${encodeURIComponent(idStr)}`,
      { responseType: 'blob' }
    )
    return res.data
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const getOrderByProductId = async productId => {
  try {
    const res = await api.get(
      `/product/get-order-by-product/${encodeURIComponent(productId)}`
    )
    return res.data
  } catch (error) {
    console.log(error)
  }
}

export const getOrderDetail = async orderId => {
  try {
    const res = await api.get(
      `/product/get-order-by-id/${encodeURIComponent(orderId)}`
    )
    return res.data
  } catch (error) {
    console.log(error)
  }
}

export const getAllAccommodationOrders = async (params = {}) => {
  try {
    const res = await api.get('/stay/get-stay-bookings', { params })
    return res.data
  } catch (error) {
    console.log(error)
  }
}
