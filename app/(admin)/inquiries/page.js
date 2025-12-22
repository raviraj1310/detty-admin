import InquiryList from '@/components/admin/InquiryList'

export default function InquiriesPage () {
  return (
    <div className='min-h-full bg-[#F4F6FB]'>
      <div className=' border border-white/80 bg-white'>
        <div className='p-3 sm:p-5 lg:p-6'>
          <InquiryList />
        </div>
      </div>
    </div>
  )
}
