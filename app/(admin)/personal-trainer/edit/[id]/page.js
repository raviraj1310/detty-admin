import EditPersonalTrainer from '@/components/personal-trainer/EditPersonalTrainer'

export default async function EditPersonalTrainerPage ({ params }) {
  const { id } = await params
  return <EditPersonalTrainer id={id} />
}
