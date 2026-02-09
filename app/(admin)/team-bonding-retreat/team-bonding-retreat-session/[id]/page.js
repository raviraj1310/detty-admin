import TeamBondingRetreatSessionMaster from '@/components/team-bonding-retreat/TeamBondingRetreatSessionMaster'

export default async function TeamBondingRetreatSessionPage ({ params }) {
  const { id } = await params
  return <TeamBondingRetreatSessionMaster />
}
