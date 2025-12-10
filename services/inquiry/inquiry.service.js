import api from '@/src/axois/axois'

export const getInquiries = async () => {
  try {
    const response = await api.get('/inquiry/get-inquiries')
    return response.data
  } catch (error) {
    console.error('Error fetching inquiries:', error)
    throw error
  }
}

export const downloadInquiriesCSV = async () => {
  try {
    const response = await api.get('/inquiry/get-inquiry-csv', {
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.error('Error downloading inquiries CSV:', error)
    throw error
  }
}
