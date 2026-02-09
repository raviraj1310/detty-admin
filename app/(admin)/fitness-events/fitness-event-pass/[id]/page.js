import FitnessEventPassManager from '@/components/fitness-events/FitnessEventPassManager'

export default async function FitnessEventPassPage ({ params }) {
  const { id } = await params
  return <FitnessEventPassManager eventId={id} />
}
