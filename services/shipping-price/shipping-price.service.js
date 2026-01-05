import api from '@/src/axois/axois'

export const getShippingPrices = async () => {
  try {
    const response = await api.get('/shipping-charges/get-shipping-charges')
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const getShippingPriceById = async id => {
  try {
    const response = await api.get(
      `/shipping-charges/get-shipping-charges/${id}`
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const createShippingPrice = async data => {
  try {
    const response = await api.post(
      '/shipping-charges/create-shipping-charge',
      data
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const updateShippingPrice = async (id, data) => {
  try {
    const response = await api.put(
      `/shipping-charges/update-shipping-charge/${id}`,
      data
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const deleteShippingPrice = async id => {
  try {
    const response = await api.delete(
      `/shipping-charges/delete-shipping-charge/${id}`
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}
