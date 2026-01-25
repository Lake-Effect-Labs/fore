import { getPublicLeagues, getMyLeagues } from '@/lib/actions';
import { LeaguesClient } from './leagues-client';

export default async function LeaguesPage() {
  const [publicLeagues, myLeagues] = await Promise.all([
    getPublicLeagues(),
    getMyLeagues().catch(() => []),
  ]);

  return (
    <LeaguesClient
      publicLeagues={publicLeagues}
      myLeagues={myLeagues}
    />
  );
}
