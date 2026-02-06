import GymBookings from '@/components/gymAccess/GymBookings'

export default function GymBookingsPage ({ params }) {
  return <GymBookings id={params.id} />
}
