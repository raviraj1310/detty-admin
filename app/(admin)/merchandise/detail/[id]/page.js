import EditMerchandise from '@/components/merchandise/EditMerchandise'

export default async function EditMerchandisePage ({ params }) {
  const p = await params
  const id = p?.id || ''
  return <EditMerchandise merchandiseId={id} />
}
