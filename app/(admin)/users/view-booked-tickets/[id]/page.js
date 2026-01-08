import Link from 'next/link'
import ViewBookedTickets from '@/components/users/ViewBookedTickets'

export default async function ViewBookedTicketsPage ({ params, searchParams }) {
  const id = String(params?.id ?? '')
  const userName = String(searchParams?.userName ?? '')
  return (
    <div className='p-4 h-full flex flex-col bg-white'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h1 className='text-xl font-bold text-gray-900 mb-1'>
            Tickets Booked
          </h1>
          <nav className='text-sm text-gray-500'>
            <span>Dashboard</span> /{' '}
            <span className='text-gray-900 font-medium'>Users</span>
          </nav>
        </div>
        <Link
          href='/users'
          className='h-9 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 flex items-center gap-1 hover:bg-gray-100'
        >
          ← Back
        </Link>
      </div>
      <ViewBookedTickets userId={id} userName={userName} />
    </div>
  )
}
