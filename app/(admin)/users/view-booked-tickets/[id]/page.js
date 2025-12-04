import ViewBookedTickets from '@/components/users/ViewBookedTickets'

export default async function ViewBookedTicketsPage({ params }) {
  const p = await params
  const id = p?.id
  return (
    <div className="p-4 h-full flex flex-col bg-white">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Tickets Booked</h1>
        <nav className="text-sm text-gray-500">
          <span>Dashboard</span> / <span className="text-gray-900 font-medium">Users</span>
        </nav>
      </div>
      <ViewBookedTickets userId={id} />
    </div>
  )
}