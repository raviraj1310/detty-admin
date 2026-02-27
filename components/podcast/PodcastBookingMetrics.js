import { Users, Wallet, AlertCircle } from 'lucide-react'

const MetricCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  bgClass,
  iconBgClass,
  iconColorClass
}) => (
  <div className={`relative overflow-hidden rounded-2xl ${bgClass} p-4`}>
    <div className='flex items-center justify-between'>
      <div className={`rounded-full ${iconBgClass} p-3`}>
        <Icon className={`h-6 w-6 ${iconColorClass}`} />
      </div>
      <div className='text-right'>
        <p className='text-xs font-medium text-gray-500 mb-1'>{title}</p>
        <div className='flex items-end justify-end gap-1'>
          <p className='text-2xl font-bold text-gray-900'>{value}</p>
          {subValue && (
            <p className='text-sm font-medium text-gray-500 mb-1'>
              ({subValue})
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
)

export default function PodcastBookingMetrics ({ metrics }) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8'>
      <MetricCard
        title='Total Subscribers'
        value={metrics.totalSubscribers}
        icon={Users}
        bgClass='bg-[#F3E8FF]'
        iconBgClass='bg-white'
        iconColorClass='text-[#9333EA]'
      />
      <MetricCard
        title='Revenue'
        value={metrics.revenue.count}
        subValue={metrics.revenue.amount}
        icon={Wallet}
        bgClass='bg-[#E0F2F1]'
        iconBgClass='bg-white'
        iconColorClass='text-[#00897B]'
      />
      <MetricCard
        title='Expiring Subscriptions (15 Days or Above)'
        value={metrics.expiring.count}
        subValue={metrics.expiring.amount}
        icon={AlertCircle}
        bgClass='bg-[#FCE7F3]'
        iconBgClass='bg-white'
        iconColorClass='text-[#DB2777]'
      />
    </div>
  )
}
