import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getRoundWithDetails,
  getMyParticipant,
  getMyRoundScores,
  getLeague,
  getSeasonStandings,
} from '@/lib/actions/leagues';
import { getFacilityHoles } from '@/lib/actions/facilities';
import { ArrowLeft, Calendar, MapPin, Trophy } from 'lucide-react';
import { LeagueRoundScoring } from '@/components/league/league-round-scoring';

interface PageProps {
  params: Promise<{ id: string; roundId: string }>;
}

export default async function LeagueRoundScoringPage({ params }: PageProps) {
  const { id: leagueId, roundId } = await params;

  const round = await getRoundWithDetails(roundId);

  if (!round) {
    notFound();
  }

  const league = await getLeague(round.season.league_id);

  if (!league) {
    notFound();
  }

  // Check if user is a participant
  const participant = await getMyParticipant(round.season_id);

  if (!participant) {
    redirect(`/leagues/${leagueId}`);
  }

  // Get hole data (if facility is set)
  let holes: {
    hole_number: number;
    par: number;
    yardage?: number | null;
    handicap_index?: number | null;
    pin_placement?: 'front' | 'middle' | 'back' | null;
    notes?: string | null;
  }[] = [];

  if (round.facility_id) {
    const facilityHoles = await getFacilityHoles(round.facility_id);
    holes = facilityHoles.map(h => ({
      hole_number: h.hole_number,
      par: h.par,
      yardage: h.yardage,
      handicap_index: h.handicap_index,
      pin_placement: h.pin_placement,
      notes: h.notes,
    }));
  } else {
    // Default 18 holes with par 4
    const numHoles = round.facility?.holes || 18;
    holes = Array.from({ length: numHoles }, (_, i) => ({
      hole_number: i + 1,
      par: 4,
    }));
  }

  // Get existing scores
  const scores = await getMyRoundScores(roundId, participant.id);

  // Get standings for leaderboard
  const standings = await getSeasonStandings(round.season_id);

  const roundDate = new Date(round.scheduled_date);
  const isToday = roundDate.toDateString() === new Date().toDateString();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <Link
        href={`/leagues/${leagueId}`}
        className="mb-4 inline-flex items-center text-sm text-[#a8d4c0] hover:text-[#e8f5f0]"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to League
      </Link>

      {/* Round Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#e8f5f0]">
              Round {round.round_number}
            </h1>
            <p className="text-[#a8d4c0]">{league.name}</p>
          </div>
          {isToday && (
            <Badge variant="success">Today</Badge>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#a8d4c0]">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {roundDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
            {round.tee_time && ` at ${round.tee_time}`}
          </div>
          {round.facility && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {round.facility.name}
            </div>
          )}
        </div>
      </div>

      {/* Scoring Component */}
      <LeagueRoundScoring
        roundId={roundId}
        participantId={participant.id}
        holes={holes}
        initialScores={scores}
        leagueId={leagueId}
        seasonId={round.season_id}
      />

      {/* Mini Leaderboard */}
      {standings.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[#c9a962]" />
              Season Standings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {standings.slice(0, 5).map((standing, index) => (
                <div
                  key={standing.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 text-center font-bold ${
                      index === 0 ? 'text-[#c9a962]' : 'text-[#a8d4c0]'
                    }`}>
                      {standing.rank}
                    </span>
                    <span className="text-[#e8f5f0]">
                      {standing.profile?.full_name || 'Unknown'}
                    </span>
                  </div>
                  <span className="text-[#a8d4c0]">
                    {standing.total_gross || '-'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
