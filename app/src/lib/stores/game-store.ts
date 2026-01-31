import { create } from 'zustand';
import type {
  Game,
  GameConfig,
  Score,
  GamePlayerWithProfile,
} from '@/types/database';

interface GameState {
  // Current game data
  game: Game | null;
  config: GameConfig | null;
  players: GamePlayerWithProfile[];
  scores: Score[];

  // Optimistic updates
  pendingScores: Map<string, number>; // key: `${playerId}-${hole}`, value: strokes
  previousScores: Map<string, number | null>; // key: `${playerId}-${hole}`, value: previous strokes (null if new)

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
  previousScores: new Map(),
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

    // Store previous value for revert
    const previousScores = new Map(get().previousScores);
    if (!previousScores.has(key)) {
      const scores = get().scores;
      const existing = scores.find(
        (s) => s.player_id === playerId && s.hole_number === hole
      );
      previousScores.set(key, existing?.strokes ?? null);
    }

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

    set({ pendingScores, previousScores, scores, isSaving: true });
  },

  confirmScore: (playerId, hole) => {
    const key = `${playerId}-${hole}`;
    const pendingScores = new Map(get().pendingScores);
    pendingScores.delete(key);
    const previousScores = new Map(get().previousScores);
    previousScores.delete(key);
    set({ pendingScores, previousScores, isSaving: pendingScores.size > 0 });
  },

  revertScore: (playerId, hole) => {
    const key = `${playerId}-${hole}`;
    const pendingScores = new Map(get().pendingScores);
    pendingScores.delete(key);

    const previousScores = new Map(get().previousScores);
    const previousValue = previousScores.get(key);
    previousScores.delete(key);

    // Revert the scores array using stored previous value
    let scores = [...get().scores];
    if (previousValue === null || previousValue === undefined) {
      // Was a new score (no previous) -- remove the temp entry
      scores = scores.filter(
        (s) => !(s.player_id === playerId && s.hole_number === hole && s.id.startsWith('temp-'))
      );
    } else {
      // Was an existing score -- restore previous strokes value
      const idx = scores.findIndex(
        (s) => s.player_id === playerId && s.hole_number === hole
      );
      if (idx >= 0) {
        scores[idx] = { ...scores[idx], strokes: previousValue };
      }
    }

    set({ pendingScores, previousScores, scores, isSaving: pendingScores.size > 0 });
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
  // Only count scores that have non-null strokes
  for (let hole = 1; hole <= game.holes; hole++) {
    const holeScores = scores.filter(
      (s) => s.hole_number === hole && s.strokes !== null
    );
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
