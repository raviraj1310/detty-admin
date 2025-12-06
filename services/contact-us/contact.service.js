import api from '@/src/axois/axois'

export const getContacts = async () => {
  try {
    const response = await api.get('/contact/get-contact')
    return response.data
  } catch (error) {
    console.error('Error fetching contacts:', error)
    throw error
  }
}

export const downloadContactsCSV = async () => {
  try {
    const response = await api.get('/contact/get-contact-csv', {
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.error('Error downloading contacts CSV:', error)
    throw error
  }
}
