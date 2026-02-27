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

export const deleteEpisode = async id => {
  try {
    const response = await apiv2.delete(`/podcast/delete-podcast-media/${id}`)
    return response.data
  } catch (error) {
    console.error('Error deleting episode:', error)
    throw error
  }
}

// subscription routes
export const getAllPodcastSubscription = async podcastId => {
  try {
    const response = await apiv2.get(
      `/podcast/get-podcast-subscriptions/${podcastId}`
    )
    return response.data
  } catch (error) {
    console.error('Error fetching podcast subscriptions:', error)
    throw error
  }
}

export const createSubscription = async payload => {
  try {
    const response = await apiv2.post(
      `/podcast/create-podcast-subscription`,
      payload
    )
    return response.data
  } catch (error) {
    console.error('Error creating podcast subscription:', error)
    throw error
  }
}

export const getSubscriptionById = async id => {
  try {
    const response = await apiv2.get(
      `/podcast/get-podcast-subscription-by-id/${id}`
    )
    return response.data
  } catch (error) {
    console.error('Error fetching podcast subscription:', error)
    throw error
  }
}

export const updateSubscription = async (id, payload) => {
  try {
    const response = await apiv2.put(
      `/podcast/update-podcast-subscription/${id}`,
      payload
    )
    return response.data
  } catch (error) {
    console.error('Error updating podcast subscription:', error)
    throw error
  }
}

export const deleteSubscription = async id => {
  try {
    const response = await apiv2.delete(
      `/podcast/delete-podcast-subscription/${id}`
    )
    return response.data
  } catch (error) {
    console.error('Error deleting podcast subscription:', error)
    throw error
  }
}

export const activeInactiveSubscription = async (id, payload) => {
  try {
    const response = await apiv2.put(
      `/podcast/change-podcast-subscription-status/${id}`,
      payload
    )
    return response.data
  } catch (error) {
    console.error('Error active/inactive podcast subscription:', error)
    throw error
  }
}

export const getPodcastBookings = async (podcastId, params = {}) => {
  try {
    const url = `/podcast/get-all-subscriptions`
    const response = await apiv2.get(url, { params })
    return response.data
  } catch (error) {
    console.error('Error fetching podcast bookings:', error)
    throw error
  }
}

export const getPodcastSubscription = async (podcastId, params = {}) => {
  try {
    const url = `/podcast/get-podcast-subscription/${podcastId}`
    const response = await apiv2.get(url, { params })
    return response.data
  } catch (error) {
    console.error('Error fetching podcast subscriptions:', error)
    throw error
  }
}
