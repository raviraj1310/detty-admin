import api from '../../src/axois/axois'

export const getAllTickets = async (params = {}) => {
  try {
    const response = await api.get('/ticket/get-all-tickets', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching all tickets:', error)
    throw error
  }
}

export const createTicket = async ticketData => {
  try {
    const response = await api.post('/ticket/create-ticket', ticketData)
    return response.data
  } catch (error) {
    console.error('Error creating ticket:', error)
    throw error
  }
}

export const getTicketById = async ticketId => {
  try {
    const response = await api.get(`/ticket/get-ticket-by-id/${ticketId}`)
    return response.data
  } catch (error) {
    console.error('Error creating ticket:', error)
    throw error
  }
}

export const editTicket = async (ticketData, ticketId) => {
  try {
    const response = await api.put(
      `/ticket/update-ticket/${ticketId}`,
      ticketData
    )
    return response.data
  } catch (error) {
    console.error('Error creating ticket:', error)
    throw error
  }
}
export const deleteTicket = async ticketId => {
  try {
    const response = await api.delete(`/ticket/delete-ticket/${ticketId}`)
    return response.data
  } catch (error) {
    console.error('Error deleting ticket:', error)
    throw error
  }
}