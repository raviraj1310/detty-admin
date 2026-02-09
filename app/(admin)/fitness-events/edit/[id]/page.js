import EditFitnessEvent from '@/components/fitness-events/EditFitnessEvent'

export default async function EditFitnessEventPage ({ params }) {
  const { id } = await params
  return <EditFitnessEvent id={id} />
}
