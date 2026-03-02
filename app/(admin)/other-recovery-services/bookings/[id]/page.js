import RecoveryServiceBookingsByService from '@/components/other-recovery-services/RecoveryServiceBookingsByService'

/**
 * Recovery-wise booking list: shows bookings for the recovery service in the URL ([id]).
 * Same UI as the main bookings page, but data from getOtherRecoveryServiceBookings(serviceId).
 */
export default function RecoveryServiceBookingsByIdPage () {
  return <RecoveryServiceBookingsByService />
}
