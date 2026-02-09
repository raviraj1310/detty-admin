import { apiv2 } from '@/src/axois/axois'

export const getPersonalTrainers = async (params = {}) => {
  try {
    const response = await apiv2.get(
      '/personal-trainer/get-all-personal-trainers',
      { params }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching personal trainers:', error)
    throw error
  }
}

export const deletePersonalTrainer = async id => {
  try {
    const response = await apiv2.delete(
      `/personal-trainer/delete-personal-trainer/${id}`
    )
    return response.data
  } catch (error) {
    console.error('Error deleting personal trainer:', error)
    throw error
  }
}

export const activeInactivePersonalTrainer = async (id, status) => {
  try {
    const response = await apiv2.put(
      `/personal-trainer/active-inactive-personal-trainer/${id}`,
      { status }
    )
    return response.data
  } catch (error) {
    console.error('Error activating personal trainer:', error)
    throw error
  }
}

export const createPersonalTrainer = async data => {
  try {
    const response = await apiv2.post(
      '/personal-trainer/create-personal-trainer',
      data
    )
    return response.data
  } catch (error) {
    console.error('Error creating personal trainer:', error)
    throw error
  }
}

export const getPersonalTrainerById = async id => {
  try {
    const response = await apiv2.get(
      `/personal-trainer/get-personal-trainer/${id}`
    )
    return response.data
  } catch (error) {
    console.error('Error fetching personal trainer by id:', error)
    throw error
  }
}

export const updatePersonalTrainer = async (id, data) => {
  try {
    const response = await apiv2.put(
      `/personal-trainer/update-personal-trainer/${id}`,
      data
    )
    return response.data
  } catch (error) {
    console.error('Error updating personal trainer:', error)
    throw error
  }
}

export const getTrainerHostList = async () => {
  try {
    const response = await apiv2.get('/personal-trainer/get-trainer-host-list')
    return response.data
  } catch (error) {
    console.error('Error fetching trainer host list:', error)
    throw error
  }
}

// training session
export const getTrainingSessions = async personalTrainerId => {
  try {
    const response = await apiv2.get(
      `/personal-trainer/get-training-sessions/${personalTrainerId}`
    )
    return response.data
  } catch (error) {
    console.error('Error fetching training sessions:', error)
    throw error
  }
}

export const createTrainingSession = async data => {
  try {
    const response = await apiv2.post(
      '/personal-trainer/create-training-session',
      data
    )
    return response.data
  } catch (error) {
    console.error('Error creating training session:', error)
    throw error
  }
}

export const updateTrainingSession = async (id, data) => {
  try {
    const response = await apiv2.put(
      `/personal-trainer/update-training-session/${id}`,
      data
    )
    return response.data
  } catch (error) {
    console.error('Error updating training session:', error)
    throw error
  }
}

export const deleteTrainingSession = async id => {
  try {
    const response = await apiv2.delete(
      `/personal-trainer/delete-training-session/${id}`
    )
    return response.data
  } catch (error) {
    console.error('Error deleting training session:', error)
    throw error
  }
}

export const getTrainingSessionById = async id => {
  try {
    const response = await apiv2.get(
      `/personal-trainer/get-training-session/${id}`
    )
    return response.data
  } catch (error) {
    console.error('Error fetching training session by id:', error)
    throw error
  }
}

export const activeInactiveTrainingSession = async (id, status) => {
  try {
    const response = await apiv2.put(
      `/personal-trainer/active-inactive-training-session/${id}`,
      { status }
    )
    return response.data
  } catch (error) {
    console.error('Error activating training session:', error)
    throw error
  }
}
