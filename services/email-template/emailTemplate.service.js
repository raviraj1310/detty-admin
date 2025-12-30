import api from '@/src/axois/axois'

export const getEmailTemplates = async () => {
  try {
    const response = await api.get('/email-template/get-email-templates')
    return response.data
  } catch (error) {
    console.error('Error fetching email templates:', error)
    throw error
  }
}
export const storeEmailTemplates = async data => {
  try {
    const response = await api.post(
      '/email-template/create-email-template',
      data
    )
    return response.data
  } catch (error) {
    console.error('Error creating/updating email template:', error)
    throw error
  }
}
