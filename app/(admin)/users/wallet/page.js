import WalletForm from '@/components/users/WalletForm'

export default function WalletPage () {
  return (
    <div className='p-4 h-screen bg-white overflow-hidden'>
      {/* Title and Breadcrumb */}
      <div className='mb-4'>
        <h1 className='text-xl font-bold text-gray-900 mb-1'>Wallet - </h1>
        <nav className='text-sm text-gray-500'>
          <span>Dashboard</span> / <span>Users</span>
        </nav>
      </div>

      {/* Wallet Form Component */}
      <WalletForm />
    </div>
  )
}
