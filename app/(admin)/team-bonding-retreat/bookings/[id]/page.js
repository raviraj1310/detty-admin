import TeamBondingRetreatBookings from '@/components/team-bonding-retreat/TeamBondingRetreatBookings'

export default async function TeamBondingRetreatBookingsPage ({ params }) {
  const { id } = await params
  return <TeamBondingRetreatBookings />
}
