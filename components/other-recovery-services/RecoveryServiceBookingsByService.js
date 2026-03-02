'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import RecoveryServiceBookingsList from './RecoveryServiceBookingsList'
import { getOtherRecoveryServiceById } from '@/services/v2/other-recovery-services/otherRecoveryServices.service'

export default function RecoveryServiceBookingsByService () {
  const { id } = useParams()
  const [serviceName, setServiceName] = useState(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    getOtherRecoveryServiceById(id)
      .then(res => {
        if (cancelled) return
        const svc = res?.recovery ?? res?.data ?? res
        setServiceName(
          svc?.recoveryServiceName ?? svc?.serviceName ?? svc?.name ?? null
        )
      })
      .catch(() => {
        if (!cancelled) setServiceName(null)
      })
    return () => { cancelled = true }
  }, [id])

  return (
    <RecoveryServiceBookingsList
      serviceId={id}
      serviceName={serviceName ?? undefined}
    />
  )
}
