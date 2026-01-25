-- Fore MVP Database Schema
-- Casual Games: Skins, Nassau, Match Play

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE game_format AS ENUM ('skins', 'nassau', 'match_play');
CREATE TYPE game_status AS ENUM ('pending', 'active', 'completed', 'cancelled');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'blocked');
CREATE TYPE account_type AS ENUM ('player', 'course_admin');

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  handicap DECIMAL(4,1),
  account_type account_type DEFAULT 'player' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Profile creation is handled in application code after signup

-- ============================================
-- FRIENDSHIPS
-- ============================================

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status friendship_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id),
  CONSTRAINT no_self_friendship CHECK (requester_id != addressee_id)
);

CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);

-- ============================================
-- GAMES
-- ============================================

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  format game_format NOT NULL,
  status game_status DEFAULT 'pending' NOT NULL,
  course_name TEXT,
  holes SMALLINT DEFAULT 18 NOT NULL CHECK (holes IN (9, 18)),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_games_created_by ON games(created_by);
CREATE INDEX idx_games_status ON games(status);

-- ============================================
-- GAME CONFIGS (format-specific settings)
-- ============================================

CREATE TABLE game_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE UNIQUE,
  -- Skins
  skin_value DECIMAL(10,2),
  carry_over BOOLEAN DEFAULT true,
  -- Nassau
  front_nine_bet DECIMAL(10,2),
  back_nine_bet DECIMAL(10,2),
  overall_bet DECIMAL(10,2),
  auto_press BOOLEAN DEFAULT false,
  press_after_down SMALLINT DEFAULT 2,
  -- Match Play
  match_bet DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- GAME PLAYERS
-- ============================================

CREATE TABLE game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_status invite_status DEFAULT 'pending' NOT NULL,
  handicap_at_game DECIMAL(4,1),
  team SMALLINT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_game_player UNIQUE (game_id, user_id)
);

CREATE INDEX idx_game_players_game ON game_players(game_id);
CREATE INDEX idx_game_players_user ON game_players(user_id);

-- ============================================
-- SCORES (hole-by-hole)
-- ============================================

CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  hole_number SMALLINT NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
  strokes SMALLINT CHECK (strokes >= 1 AND strokes <= 20),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_score UNIQUE (game_id, player_id, hole_number)
);

CREATE INDEX idx_scores_game ON scores(game_id);
CREATE INDEX idx_scores_player ON scores(player_id);

-- ============================================
-- SETTLEMENTS (who owes who)
-- ============================================

CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  from_player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  to_player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  is_paid BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_settlements_game ON settlements(game_id);
CREATE INDEX idx_settlements_from ON settlements(from_player_id);
CREATE INDEX idx_settlements_to ON settlements(to_player_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Friendships: involved users can view and manage
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friendship requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships they're part of"
  ON friendships FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete own friendship requests"
  ON friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Games: creators and players can view
CREATE POLICY "Users can view games they're in"
  ON games FOR SELECT
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = games.id
      AND game_players.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create games"
  ON games FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update games"
  ON games FOR UPDATE
  USING (auth.uid() = created_by);

-- Game Configs: same as games
CREATE POLICY "Users can view game configs for their games"
  ON game_configs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_configs.game_id
      AND (
        games.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM game_players
          WHERE game_players.game_id = games.id
          AND game_players.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Game creators can insert configs"
  ON game_configs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_configs.game_id
      AND games.created_by = auth.uid()
    )
  );

CREATE POLICY "Game creators can update configs"
  ON game_configs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_configs.game_id
      AND games.created_by = auth.uid()
    )
  );

-- Game Players: game participants can view
CREATE POLICY "Users can view game players"
  ON game_players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_players.game_id
      AND (
        games.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM game_players gp2
          WHERE gp2.game_id = games.id
          AND gp2.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Game creators can add players"
  ON game_players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_players.game_id
      AND games.created_by = auth.uid()
    )
  );

CREATE POLICY "Players can update own invite status"
  ON game_players FOR UPDATE
  USING (user_id = auth.uid());

-- Scores: game participants can view and update own
CREATE POLICY "Users can view scores in their games"
  ON scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.id = scores.player_id
      AND game_players.game_id = scores.game_id
      AND EXISTS (
        SELECT 1 FROM game_players gp2
        WHERE gp2.game_id = scores.game_id
        AND gp2.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Players can insert own scores"
  ON scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.id = scores.player_id
      AND game_players.user_id = auth.uid()
    )
  );

CREATE POLICY "Players can update own scores"
  ON scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.id = scores.player_id
      AND game_players.user_id = auth.uid()
    )
  );

-- Settlements: game participants can view
CREATE POLICY "Users can view settlements in their games"
  ON settlements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = settlements.game_id
      AND game_players.user_id = auth.uid()
    )
  );

CREATE POLICY "Game creators can insert settlements"
  ON settlements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = settlements.game_id
      AND games.created_by = auth.uid()
    )
  );

CREATE POLICY "Settlement participants can update payment status"
  ON settlements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE (game_players.id = settlements.from_player_id OR game_players.id = settlements.to_player_id)
      AND game_players.user_id = auth.uid()
    )
  );
