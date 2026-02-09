import FitnessEventBookings from '@/components/fitness-events/FitnessEventBookings'

export default async function FitnessEventBookingsPage ({ params }) {
  const { id } = await params
  return <FitnessEventBookings eventId={id} />
}
