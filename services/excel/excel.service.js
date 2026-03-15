import { apiv2 } from '@/src/axois/axois'

export const downloadGymList = async params => {
  try {
    const response = await apiv2.get('/excel/download-gym-list', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}
export const downloadGymBookings = async params => {
  try {
    const response = await apiv2.get('/excel/download-gym-bookings', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const downloadPersonalTrainerList = async params => {
  try {
    const response = await apiv2.get('/excel/download-personal-trainer-list', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const downloadPersonalTrainerBookings = async params => {
  try {
    const response = await apiv2.get(
      '/excel/download-personal-trainer-bookings',
      {
        params,
        responseType: 'blob'
      }
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}

// team bonding
export const downloadTeamBondingList = async params => {
  try {
    const response = await apiv2.get('/excel/download-team-bonding-list', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const downloadTeamBondingBookings = async params => {
  try {
    const response = await apiv2.get('/excel/download-team-bonding-bookings', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

// fitness event
export const downloadFitnessEventList = async params => {
  try {
    const response = await apiv2.get('/excel/download-fitness-event-list', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const downloadFitnessEventBookings = async params => {
  try {
    const response = await apiv2.get('/excel/download-fitness-event-bookings', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

// podcast
export const downloadPodcastList = async params => {
  try {
    const response = await apiv2.get('/excel/download-podcast-list', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const downloadPodcastBookings = async params => {
  try {
    const response = await apiv2.get('/excel/download-podcast-bookings', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

// spa
export const downloadSpaList = async params => {
  try {
    const response = await apiv2.get('/excel/download-spa-list', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const downloadSpaBookings = async params => {
  try {
    const response = await apiv2.get('/excel/download-spa-bookings', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

// other recovery
export const downloadOtherRecoveryList = async params => {
  try {
    const response = await apiv2.get('/excel/download-recovery-list', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const downloadOtherRecoveryBookings = async params => {
  try {
    const response = await apiv2.get('/excel/download-recovery-bookings', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

// food
export const downloadFoodList = async params => {
  try {
    const response = await apiv2.get('/excel/download-food-list', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const downloadFoodBookings = async params => {
  try {
    const response = await apiv2.get('/excel/download-food-bookings', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

// weight management
export const downloadWeightManagementList = async params => {
  try {
    const response = await apiv2.get('/excel/download-weight-management-list', {
      params,
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.log(error)
  }
}

export const downloadWeightManagementBookings = async params => {
  try {
    const response = await apiv2.get(
      '/excel/download-weight-management-bookings',
      {
        params,
        responseType: 'blob'
      }
    )
    return response.data
  } catch (error) {
    console.log(error)
  }
}
