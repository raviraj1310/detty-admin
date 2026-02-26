import GymBookingDetails from '@/components/gymAccess/GymBookingDetails'

export default async function GymBookingViewPage ({ params }) {
  const { id } = await params
  return <GymBookingDetails bookingId={id} />
}
