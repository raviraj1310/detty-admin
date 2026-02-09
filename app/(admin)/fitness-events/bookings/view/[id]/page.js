import FitnessEventBookingDetails from '@/components/fitness-events/FitnessEventBookingDetails'

export default async function FitnessEventBookingDetailsPage ({ params }) {
  const { id } = await params
  return <FitnessEventBookingDetails bookingId={id} />
}
