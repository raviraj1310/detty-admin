import EditActivity from "@/components/placesToVisit/EditActivity";

export default async function EditActivityPage({ params }) {
  const p = await params;
  const id = p?.id || '';
  return <EditActivity activityId={id} />;
}