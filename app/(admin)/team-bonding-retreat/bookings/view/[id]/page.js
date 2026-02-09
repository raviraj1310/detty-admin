import TeamBondingRetreatBookingDetails from '@/components/team-bonding-retreat/TeamBondingRetreatBookingDetails'

export default async function TeamBondingRetreatBookingViewPage ({ params }) {
  const { id } = await params
  return <TeamBondingRetreatBookingDetails id={id} />
}
