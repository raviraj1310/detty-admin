import api from '../../src/axois/axois'

export const getMerchandiseCategories = async () => {
  try {
    const res = await api.get('/merchandise/get-all-merchandise')
    return res.data
  } catch (error) {
    console.log(error)
  }
}

export const getMerchandiseCategoryById = async id => {
  try {
    const res = await api.get(`/merchandise/get-merchandise-by-id/${id}`)
    return res.data
  } catch (error) {
    console.log(error)
  }
}

export const createMerchandiseCategory = async data => {
  try {
    const res = await api.post('/merchandise/create-merchandise', data)
    return res.data
  } catch (error) {
    console.log(error)
  }
}


export const updateMerchandiseCategory = async (id, data) => {
  try {
    const res = await api.put(`/merchandise/update-merchandise/${id}`, data)
    return res.data
  } catch (error) {
    console.log(error)
  }
}

export const deleteMerchandiseCategory = async id => {
  try {
    const res = await api.delete(`/merchandise/delete-merchandise/${id}`)
    return res.data
  } catch (error) {
    console.log(error)
  }
}
