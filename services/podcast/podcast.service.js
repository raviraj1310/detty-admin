import { apiv2 } from '@/src/axois/axois'

export const getPodcasts = async () => {
  try {
    const response = await apiv2.get('/podcast/get-podcast')
    return response.data
  } catch (error) {
    console.error('Error fetching podcasts:', error)
    throw error
  }
}

export const deletePodcast = async id => {
  try {
    const response = await apiv2.delete(`/podcast/hard-delete-podcast/${id}`)
    return response.data
  } catch (error) {
    console.error('Error deleting podcast:', error)
    throw error
  }
}

export const updateStatus = async (id, status) => {
  try {
    const response = await apiv2.put(`/podcast/change-podcast-status/${id}`, {
      status
    })
    return response.data
  } catch (error) {
    console.error('Error updating podcast status:', error)
    throw error
  }
}

export const getPodcastById = async id => {
  try {
    const response = await apiv2.get(`/podcast/get-podcast-by-id/${id}`)
    return response.data
  } catch (error) {
    console.error('Error fetching podcast:', error)
    throw error
  }
}

export const createPodcast = async podcast => {
  try {
    const response = await apiv2.post('/podcast/create-podcast', podcast)
    return response.data
  } catch (error) {
    console.error('Error adding podcast:', error)
    throw error
  }
}

export const addEpisode = async episode => {
  try {
    const response = await apiv2.post(
      '/podcast/create-multiple-podcast-media',
      episode,
      {
        timeout: 600000 // 10 minutes
      }
    )
    return response.data
  } catch (error) {
    console.error('Error adding episode:', error)
    throw error
  }
}

export const updatePodcast = async (id, podcast) => {
  try {
    const response = await apiv2.put(`/podcast/update-podcast/${id}`, podcast)
    return response.data
  } catch (error) {
    console.error('Error updating podcast:', error)
    throw error
  }
}

export const updatePodcastEpisode = async (id, episode) => {
  try {
    const response = await apiv2.put(
      `/podcast/update-podcast-media/${id}`,
      episode
    )
    return response.data
  } catch (error) {
    console.error('Error updating podcast episode:', error)
    throw error
  }
}
