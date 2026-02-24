import GymBookings from '@/components/gymAccess/GymBookings'

export default async function GymBookingsPage ({ params }) {
  const resolvedParams = await params
  return <GymBookings id={resolvedParams.id} />
}
