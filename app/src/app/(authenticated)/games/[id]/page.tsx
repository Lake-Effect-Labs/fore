import { notFound } from 'next/navigation';
import { getGame, getProfile } from '@/lib/actions';
import { GameView } from '@/components/game/game-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GamePage({ params }: PageProps) {
  const { id } = await params;
  const [game, profile] = await Promise.all([getGame(id), getProfile()]);

  if (!game) {
    notFound();
  }

  return <GameView game={game} currentUserId={profile?.id || ''} />;
}
