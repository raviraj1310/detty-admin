import RequestDeactivation from '@/components/admin/RequestDeactivation'

export default function RequestDeactivationPage () {
  return (
    <div className='min-h-full bg-[#F4F6FB]'>
      <div className='rounded-[30px] border border-white/80 bg-white'>
        <div className='p-6 sm:p-8 lg:p-10'>
          <RequestDeactivation />
        </div>
      </div>
    </div>
  )
}

