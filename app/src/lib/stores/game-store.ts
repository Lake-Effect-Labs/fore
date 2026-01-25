import { create } from 'zustand';
import type {
  Game,
  GameConfig,
  Score,
  GamePlayerWithProfile,
  GameFormat,
} from '@/types/database';

interface GameState {
  // Current game data
  game: Game | null;
  config: GameConfig | null;
  players: GamePlayerWithProfile[];
  scores: Score[];

  // Optimistic updates
  pendingScores: Map<string, number>; // key: `${playerId}-${hole}`, value: strokes

  // Loading states
  isLoading: boolean;
  isSaving: boolean;

  // Actions
  setGame: (game: Game | null) => void;
  setConfig: (config: GameConfig | null) => void;
  setPlayers: (players: GamePlayerWithProfile[]) => void;
  setScores: (scores: Score[]) => void;

  // Optimistic score update
  updateScoreOptimistic: (playerId: string, hole: number, strokes: number) => void;
  confirmScore: (playerId: string, hole: number) => void;
  revertScore: (playerId: string, hole: number) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  game: null,
  config: null,
  players: [],
  scores: [],
  pendingScores: new Map(),
  isLoading: false,
  isSaving: false,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setGame: (game) => set({ game }),
  setConfig: (config) => set({ config }),
  setPlayers: (players) => set({ players }),
  setScores: (scores) => set({ scores }),

  updateScoreOptimistic: (playerId, hole, strokes) => {
    const key = `${playerId}-${hole}`;
    const pendingScores = new Map(get().pendingScores);
    pendingScores.set(key, strokes);

    // Also update the scores array optimistically
    const scores = [...get().scores];
    const existingIdx = scores.findIndex(
      (s) => s.player_id === playerId && s.hole_number === hole
    );

    if (existingIdx >= 0) {
      scores[existingIdx] = { ...scores[existingIdx], strokes };
    } else {
      scores.push({
        id: `temp-${key}`,
        game_id: get().game?.id || '',
        player_id: playerId,
        hole_number: hole,
        strokes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    set({ pendingScores, scores, isSaving: true });
  },

  confirmScore: (playerId, hole) => {
    const key = `${playerId}-${hole}`;
    const pendingScores = new Map(get().pendingScores);
    pendingScores.delete(key);
    set({ pendingScores, isSaving: pendingScores.size > 0 });
  },

  revertScore: (playerId, hole) => {
    const key = `${playerId}-${hole}`;
    const pendingScores = new Map(get().pendingScores);
    const previousValue = pendingScores.get(key);
    pendingScores.delete(key);

    // Revert the scores array
    const scores = get().scores.filter(
      (s) => !(s.player_id === playerId && s.hole_number === hole && s.id.startsWith('temp-'))
    );

    set({ pendingScores, scores, isSaving: pendingScores.size > 0 });
  },

  reset: () => set(initialState),
}));

// Selector hooks for computed values
export const useCurrentHole = () => {
  const scores = useGameStore((state) => state.scores);
  const players = useGameStore((state) => state.players);
  const game = useGameStore((state) => state.game);

  if (!game || players.length === 0) return 1;

  // Find the first hole where not all players have scored
  for (let hole = 1; hole <= game.holes; hole++) {
    const holeScores = scores.filter((s) => s.hole_number === hole);
    if (holeScores.length < players.length) {
      return hole;
    }
  }

  return game.holes; // All holes complete
};

export const usePlayerScore = (playerId: string, hole: number) => {
  return useGameStore((state) => {
    const score = state.scores.find(
      (s) => s.player_id === playerId && s.hole_number === hole
    );
    return score?.strokes ?? null;
  });
};

export const usePlayerTotal = (playerId: string) => {
  return useGameStore((state) => {
    return state.scores
      .filter((s) => s.player_id === playerId && s.strokes !== null)
      .reduce((sum, s) => sum + (s.strokes || 0), 0);
  });
};
