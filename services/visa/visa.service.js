import api from '@/src/axois/axois'

export const getVisaApplications = async () => {
  try {
    const response = await api.get('/visa-application/get-visa-applications')
    return response.data
  } catch (error) {
    console.error('Error fetching visa applications:', error)
    throw error
  }
}

export const getVisaApplicationById = async id => {
  try {
    const response = await api.get(
      `/visa-application/get-visa-applications-detail/${id}`
    )
    return response.data
  } catch (error) {
    console.error('Error fetching visa application:', error)
    throw error
  }
}

export const downloadVisaApplicationsCSV = async () => {
  try {
    const response = await api.get('/visa-application/download-visa-csv', {
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.error('Error downloading visa applications CSV:', error)
    throw error
  }
}

export const updateStatus = async payload => {
  try {
    const response = await api.post(
      `/visa-application/update-visa-status`,
      payload
    )
    return response.data
  } catch (error) {
    console.error('Error updating visa application status:', error)
    throw error
  }
}
