// Database types for Fore MVP
// Matches Supabase schema

export type GameFormat = 'skins' | 'nassau' | 'match_play';
export type GameStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type InviteStatus = 'pending' | 'accepted' | 'declined';
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

// ============================================
// Core Tables
// ============================================

export type AccountType = 'player' | 'course_admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  handicap: number | null;
  account_type: AccountType;
  created_at: string;
  updated_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  created_by: string;
  format: GameFormat;
  status: GameStatus;
  course_name: string | null;
  holes: 9 | 18;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface GameConfig {
  id: string;
  game_id: string;
  // Skins config
  skin_value: number | null;
  carry_over: boolean | null;
  // Nassau config
  front_nine_bet: number | null;
  back_nine_bet: number | null;
  overall_bet: number | null;
  auto_press: boolean | null;
  press_after_down: number | null;
  // Match Play config
  match_bet: number | null;
  created_at: string;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  user_id: string;
  invite_status: InviteStatus;
  handicap_at_game: number | null;
  team: number | null; // For team-based formats
  created_at: string;
}

export interface Score {
  id: string;
  game_id: string;
  player_id: string; // References game_players.id
  hole_number: number; // 1-18
  strokes: number | null;
  created_at: string;
  updated_at: string;
}

export interface Settlement {
  id: string;
  game_id: string;
  from_player_id: string; // References game_players.id
  to_player_id: string; // References game_players.id
  amount: number;
  reason: string; // e.g., "skins_hole_5", "nassau_front", "match_play"
  is_paid: boolean;
  created_at: string;
}

// ============================================
// Joined/Extended Types (for queries)
// ============================================

export interface GamePlayerWithProfile extends GamePlayer {
  profile: Profile;
}

export interface GameWithPlayers extends Game {
  config: GameConfig | null;
  players: GamePlayerWithProfile[];
}

export interface GameWithDetails extends GameWithPlayers {
  scores: Score[];
  settlements: Settlement[];
}

export interface ScoresByHole {
  [holeNumber: number]: {
    [playerId: string]: number | null;
  };
}

// ============================================
// Game Results (calculated)
// ============================================

export interface SkinsResult {
  hole: number;
  winner_id: string | null; // null if carried over
  value: number;
  carried: boolean;
}

export interface NassauResult {
  front_nine: {
    winner_id: string | null;
    margin: number;
  };
  back_nine: {
    winner_id: string | null;
    margin: number;
  };
  overall: {
    winner_id: string | null;
    margin: number;
  };
  presses: {
    start_hole: number;
    winner_id: string | null;
    margin: number;
  }[];
}

export interface MatchPlayResult {
  status: 'in_progress' | 'finished';
  leader_id: string | null;
  holes_up: number;
  holes_remaining: number;
  final_result: string | null; // e.g., "3&2", "1 up", "All Square"
}

export interface SettlementSummary {
  player_id: string;
  profile: Profile;
  total_won: number;
  total_lost: number;
  net: number;
  owes: { to_player_id: string; amount: number }[];
  owed_by: { from_player_id: string; amount: number }[];
}

// ============================================
// API/Form Types
// ============================================

export interface CreateGameInput {
  format: GameFormat;
  course_name?: string;
  holes: 9 | 18;
  player_ids: string[]; // User IDs to invite
  config: Partial<GameConfig>;
}

export interface UpdateScoreInput {
  game_id: string;
  player_id: string;
  hole_number: number;
  strokes: number;
}

// ============================================
// Supabase Database Schema Type
// ============================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      friendships: {
        Row: Friendship;
        Insert: Omit<Friendship, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Friendship, 'id' | 'created_at'>>;
      };
      games: {
        Row: Game;
        Insert: Omit<Game, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Game, 'id' | 'created_at'>>;
      };
      game_configs: {
        Row: GameConfig;
        Insert: Omit<GameConfig, 'id' | 'created_at'>;
        Update: Partial<Omit<GameConfig, 'id' | 'game_id' | 'created_at'>>;
      };
      game_players: {
        Row: GamePlayer;
        Insert: Omit<GamePlayer, 'id' | 'created_at'>;
        Update: Partial<Omit<GamePlayer, 'id' | 'game_id' | 'created_at'>>;
      };
      scores: {
        Row: Score;
        Insert: Omit<Score, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Score, 'id' | 'created_at'>>;
      };
      settlements: {
        Row: Settlement;
        Insert: Omit<Settlement, 'id' | 'created_at'>;
        Update: Partial<Omit<Settlement, 'id' | 'game_id' | 'created_at'>>;
      };
    };
  };
}
