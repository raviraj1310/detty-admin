import TransactionsForm from '@/components/users/TransactionsForm'

export default function TransactionsPage () {
  return (
    <div className='p-4 h-full flex flex-col bg-white'>
      {/* Title and Breadcrumb */}
      <div className='mb-4'>
        <h1 className='text-xl font-bold text-gray-900 mb-1'>
          Gross Transaction Value
        </h1>
        <nav className='text-sm text-gray-500'>
          <span>Dashboard</span> / <span>Gross Transaction Value</span>
        </nav>
      </div>

      {/* Transactions Form Component */}
      <TransactionsForm />
    </div>
  )
}
