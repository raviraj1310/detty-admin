import ViewVisaApplication from "@/components/visa/ViewVisaApplication"


export default async function ViewVisaApplicationPage({ params }) {
  const p = await params
  const id = p?.id || ''
  return <ViewVisaApplication applicationId={id} />
}