import EditEvent from "@/components/discoverEvent/EditEvent";

export default async function EditEventPage({ params }) {
  const p = await params;
  const id = p?.id || '';
  return <EditEvent eventId={id} />;
}