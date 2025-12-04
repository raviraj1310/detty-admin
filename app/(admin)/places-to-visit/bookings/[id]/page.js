import TicketsIdBooked from '@/components/placesToVisit/TicketsIdBooked';

export default function TicketsBookedPage({ params }) {
  return <TicketsIdBooked activityId={params.id} />;
}
