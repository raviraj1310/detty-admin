import GymBookingDetails from '@/components/gymAccess/GymBookingDetails'

export default function GymBookingViewPage ({ params }) {
  return <GymBookingDetails id={params.id} />
}
