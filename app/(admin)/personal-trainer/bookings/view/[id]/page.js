import PersonalTrainerBookingDetails from '@/components/personal-trainer/PersonalTrainerBookingDetails'

export default async function PersonalTrainerBookingViewPage ({ params }) {
  const { id } = await params
  return <PersonalTrainerBookingDetails id={id} />
}
