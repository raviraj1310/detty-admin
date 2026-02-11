import { apiv2 } from '@/src/axois/axois'

export const getTeamBondingRetreatList = async () => {
  try {
    const teamBondingRetreatList = await apiv2.get(`/team-bonding/get-all`)
    return teamBondingRetreatList
  } catch (error) {
    console.error('Error fetching team bonding retreat list:', error)
    throw error
  }
}

export const getTeamBondingRetreatById = async id => {
  try {
    const teamBondingRetreatDetail = await apiv2.get(`/team-bonding/get/${id}`)
    return teamBondingRetreatDetail
  } catch (error) {
    console.error('Error fetching team bonding retreat detail:', error)
    throw error
  }
}

export const createTeamBondingRetreat = async data => {
  try {
    const teamBondingRetreat = await apiv2.post(`/team-bonding/create`, data)
    return teamBondingRetreat
  } catch (error) {
    console.error('Error creating team bonding retreat:', error)
    throw error
  }
}

export const updateTeamBondingRetreat = async (id, data) => {
  try {
    const teamBondingRetreat = await apiv2.put(
      `/team-bonding/update/${id}`,
      data
    )
    return teamBondingRetreat
  } catch (error) {
    console.error('Error updating team bonding retreat:', error)
    throw error
  }
}

export const deleteTeamBondingRetreat = async id => {
  try {
    const teamBondingRetreat = await apiv2.delete(`/team-bonding/delete/${id}`)
    return teamBondingRetreat
  } catch (error) {
    console.error('Error deleting team bonding retreat:', error)
    throw error
  }
}

export const activeInactiveTeamBondingRetreat = async (id, data) => {
  try {
    const teamBondingRetreat = await apiv2.put(
      `/team-bonding/active-inactive/${id}`,
      data
    )
    return teamBondingRetreat
  } catch (error) {
    console.error('Error active/inactive team bonding retreat:', error)
    throw error
  }
}

// session APIs

export const getTeamBondingRetreatSessionList = async teamBondingId => {
  try {
    const teamBondingRetreatSessionList = await apiv2.get(
      `/team-bonding/get-all-sessions/${teamBondingId}`
    )
    return teamBondingRetreatSessionList
  } catch (error) {
    console.error('Error fetching team bonding retreat session list:', error)
    throw error
  }
}

export const createTeamBondingRetreatSession = async data => {
  try {
    const teamBondingRetreatSession = await apiv2.post(
      `/team-bonding/create-session`,
      data
    )
    return teamBondingRetreatSession
  } catch (error) {
    console.error('Error creating team bonding retreat session:', error)
    throw error
  }
}

export const getSessionById = async sessionId => {
  try {
    const sessionDetail = await apiv2.get(
      `/team-bonding/get-session/${sessionId}`
    )
    return sessionDetail
  } catch (error) {
    console.error('Error fetching session detail:', error)
    throw error
  }
}

export const updateSessionById = async (sessionId, data) => {
  try {
    const sessionDetail = await apiv2.put(
      `/team-bonding/update-session/${sessionId}`,
      data
    )
    return sessionDetail
  } catch (error) {
    console.error('Error updating session detail:', error)
    throw error
  }
}

export const deleteSessionById = async sessionId => {
  try {
    const sessionDetail = await apiv2.delete(
      `/team-bonding/delete-session/${sessionId}`
    )
    return sessionDetail
  } catch (error) {
    console.error('Error deleting session detail:', error)
    throw error
  }
}

export const activeInactiveSessionById = async (sessionId, data) => {
  try {
    const sessionDetail = await apiv2.put(
      `/team-bonding/active-inactive-session/${sessionId}`,
      data
    )
    return sessionDetail
  } catch (error) {
    console.error('Error active/inactive session detail:', error)
    throw error
  }
}