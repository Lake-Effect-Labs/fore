-- Fore B2B Schema: Organizations, Leagues, Events, Courses
-- Phase 2: Golf Course Management

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE org_role AS ENUM ('owner', 'admin', 'pro_shop', 'member');
CREATE TYPE league_type AS ENUM ('weekly', 'seasonal', 'tournament');
CREATE TYPE event_format AS ENUM ('stroke_play', 'match_play', 'scramble', 'best_ball', 'shamble', 'stableford');
CREATE TYPE event_status AS ENUM ('draft', 'open', 'closed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'waitlisted', 'cancelled');
CREATE TYPE tee_color AS ENUM ('black', 'blue', 'white', 'gold', 'red');
CREATE TYPE event_visibility AS ENUM ('private', 'link', 'public');
CREATE TYPE event_payment_status AS ENUM ('pending', 'paid', 'refunded', 'not_required');

-- ============================================
-- ORGANIZATIONS (Golf Courses)
-- ============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  timezone TEXT DEFAULT 'America/New_York',
  -- Subscription
  stripe_customer_id TEXT,
  subscription_tier TEXT DEFAULT 'free', -- free, pro, enterprise
  subscription_status TEXT DEFAULT 'active',
  -- Settings
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- ============================================
-- ORGANIZATION MEMBERS
-- ============================================

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role org_role DEFAULT 'member' NOT NULL,
  member_number TEXT, -- Club member number
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_org_member UNIQUE (organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- ============================================
-- HELPER FUNCTIONS FOR RLS (SECURITY DEFINER)
-- ============================================

-- Check if user is a member of an organization (bypasses RLS)
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is an admin of an organization (bypasses RLS)
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = user_uuid
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add the first owner to an organization (bypasses RLS for initial insert)
CREATE OR REPLACE FUNCTION add_organization_owner(org_id UUID, owner_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (org_id, owner_id, 'owner');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FACILITIES (Physical Courses)
-- ============================================

CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Main Course", "Executive Course"
  description TEXT,
  holes SMALLINT DEFAULT 18 CHECK (holes IN (9, 18)),
  par SMALLINT,
  slope_rating DECIMAL(4,1),
  course_rating DECIMAL(4,1),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_facilities_org ON facilities(organization_id);

-- ============================================
-- TEES (Different tee boxes per facility)
-- ============================================

CREATE TABLE tees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Championship", "Men's", "Ladies"
  color tee_color,
  total_yards SMALLINT,
  slope_rating DECIMAL(4,1),
  course_rating DECIMAL(4,1),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tees_facility ON tees(facility_id);

-- ============================================
-- HOLES (Per facility)
-- ============================================

CREATE TABLE holes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  hole_number SMALLINT NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
  par SMALLINT NOT NULL CHECK (par >= 3 AND par <= 6),
  handicap_index SMALLINT CHECK (handicap_index >= 1 AND handicap_index <= 18), -- Hole difficulty ranking
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_hole UNIQUE (facility_id, hole_number)
);

CREATE INDEX idx_holes_facility ON holes(facility_id);

-- ============================================
-- HOLE YARDAGES (Per tee)
-- ============================================

CREATE TABLE hole_yardages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hole_id UUID NOT NULL REFERENCES holes(id) ON DELETE CASCADE,
  tee_id UUID NOT NULL REFERENCES tees(id) ON DELETE CASCADE,
  yards SMALLINT NOT NULL,
  CONSTRAINT unique_hole_tee UNIQUE (hole_id, tee_id)
);

-- ============================================
-- LEAGUES
-- ============================================

CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  league_type league_type DEFAULT 'weekly' NOT NULL,
  format event_format DEFAULT 'stroke_play' NOT NULL,
  -- Schedule
  day_of_week SMALLINT CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
  start_time TIME,
  -- Settings
  max_players SMALLINT,
  handicap_percentage SMALLINT DEFAULT 100, -- What % of handicap to use
  entry_fee DECIMAL(10,2),
  settings JSONB DEFAULT '{}', -- Extended league settings (handicap mode, divisions, etc.)
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_leagues_org ON leagues(organization_id);

-- ============================================
-- SEASONS
-- ============================================

CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Spring 2024", "Summer League"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_seasons_league ON seasons(league_id);

-- ============================================
-- LEAGUE PARTICIPANTS
-- ============================================

CREATE TABLE league_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  handicap_at_start DECIMAL(4,1),
  team_id UUID, -- For team leagues
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_season_participant UNIQUE (season_id, user_id)
);

CREATE INDEX idx_league_participants_season ON league_participants(season_id);
CREATE INDEX idx_league_participants_user ON league_participants(user_id);

-- ============================================
-- ROUNDS (Scheduled league play dates)
-- ============================================

CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id),
  round_number SMALLINT NOT NULL,
  scheduled_date DATE NOT NULL,
  tee_time TIME,
  status game_status DEFAULT 'pending' NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_rounds_season ON rounds(season_id);

-- ============================================
-- ROUND SCORES
-- ============================================

CREATE TABLE round_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES league_participants(id) ON DELETE CASCADE,
  hole_number SMALLINT NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
  strokes SMALLINT CHECK (strokes >= 1 AND strokes <= 20),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_round_score UNIQUE (round_id, participant_id, hole_number)
);

CREATE INDEX idx_round_scores_round ON round_scores(round_id);
CREATE INDEX idx_round_scores_participant ON round_scores(participant_id);

-- ============================================
-- HANDICAP HISTORY
-- ============================================

CREATE TABLE handicap_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  handicap_index DECIMAL(4,1) NOT NULL,
  effective_date DATE NOT NULL,
  rounds_used SMALLINT, -- Number of rounds used in calculation
  calculation_details JSONB, -- Store the scores used
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_handicap_history_user ON handicap_history(user_id);
CREATE INDEX idx_handicap_history_date ON handicap_history(effective_date DESC);

-- ============================================
-- LEAGUE STANDINGS (Calculated/Cached)
-- ============================================

CREATE TABLE league_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES league_participants(id) ON DELETE CASCADE,
  rounds_played SMALLINT DEFAULT 0,
  total_points DECIMAL(10,2) DEFAULT 0,
  total_gross SMALLINT DEFAULT 0,
  total_net SMALLINT DEFAULT 0,
  average_gross DECIMAL(5,2),
  average_net DECIMAL(5,2),
  current_handicap DECIMAL(4,1),
  rank SMALLINT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_standing UNIQUE (season_id, participant_id)
);

CREATE INDEX idx_standings_season ON league_standings(season_id);

-- ============================================
-- EVENTS (Outings/Tournaments)
-- ============================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id),
  name TEXT NOT NULL,
  slug TEXT, -- URL-friendly identifier for public event pages
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  format event_format NOT NULL,
  status event_status DEFAULT 'draft' NOT NULL,
  visibility event_visibility DEFAULT 'private' NOT NULL,
  -- Organizer (player account who manages the event)
  organizer_id UUID REFERENCES profiles(id),
  -- Registration
  max_players SMALLINT,
  registration_opens_at TIMESTAMPTZ,
  registration_closes_at TIMESTAMPTZ,
  entry_fee DECIMAL(10,2),
  course_fee DECIMAL(10,2), -- What the course charges per player
  -- Settings
  team_size SMALLINT DEFAULT 1, -- 1=individual, 2=pairs, 4=foursome
  handicap_percentage SMALLINT DEFAULT 100,
  flights_enabled BOOLEAN DEFAULT false,
  shotgun_start BOOLEAN DEFAULT false,
  -- Prizes
  prize_pool DECIMAL(10,2),
  prize_structure JSONB, -- How prizes are distributed
  -- Sponsors
  sponsors JSONB, -- Array of sponsor info
  -- Meta
  cover_image_url TEXT,
  -- Extended settings
  settings JSONB DEFAULT '{}', -- Extended event configuration
  organizer_can_configure BOOLEAN DEFAULT false, -- If true, organizer sets most settings
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_event_slug UNIQUE (organization_id, slug)
);

CREATE INDEX idx_events_org ON events(organization_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);

-- ============================================
-- EVENT REGISTRATIONS
-- ============================================

CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL for guest registrations
  guest_name TEXT, -- Name for guests without accounts
  guest_email TEXT, -- Email for guests (used to claim registration when they sign up)
  team_name TEXT, -- For team events
  status registration_status DEFAULT 'pending' NOT NULL,
  handicap_at_registration DECIMAL(4,1),
  flight_id UUID, -- Assigned flight
  tee_time TIME,
  starting_hole SMALLINT, -- For shotgun starts
  group_number SMALLINT, -- Group assignment for organizing players
  payment_status event_payment_status DEFAULT 'pending' NOT NULL,
  payment_id TEXT, -- Stripe payment intent ID
  invited_by UUID REFERENCES profiles(id), -- Who invited this player to join their group
  notes TEXT,
  checked_in BOOLEAN DEFAULT false, -- Has player checked in for event day
  checked_in_at TIMESTAMPTZ, -- When player checked in
  registered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Unique constraint: one registration per user per event (for registered users)
  -- Guests are identified by event_id + guest_email
  CONSTRAINT unique_event_user_registration UNIQUE (event_id, user_id),
  CONSTRAINT unique_event_guest_registration UNIQUE (event_id, guest_email),
  -- Either user_id or guest info must be provided
  CONSTRAINT user_or_guest CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_email IS NOT NULL))
);

CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user ON event_registrations(user_id);

-- ============================================
-- EVENT TEAMS (For team events)
-- ============================================

CREATE TABLE event_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  captain_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_event_teams_event ON event_teams(event_id);

-- ============================================
-- EVENT TEAM MEMBERS
-- ============================================

CREATE TABLE event_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES event_teams(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_team_member UNIQUE (team_id, registration_id)
);

-- ============================================
-- FLIGHTS (Divisions within events)
-- ============================================

CREATE TABLE flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "A Flight", "Championship", "Senior"
  min_handicap DECIMAL(4,1),
  max_handicap DECIMAL(4,1),
  sort_order SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_flights_event ON flights(event_id);

-- ============================================
-- EVENT SCORES
-- ============================================

CREATE TABLE event_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES event_teams(id),
  hole_number SMALLINT NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
  strokes SMALLINT CHECK (strokes >= 1 AND strokes <= 20),
  -- For team formats
  team_score SMALLINT, -- Best ball, scramble result
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_event_score UNIQUE (event_id, registration_id, hole_number)
);

CREATE INDEX idx_event_scores_event ON event_scores(event_id);
CREATE INDEX idx_event_scores_registration ON event_scores(registration_id);

-- ============================================
-- EVENT LEADERBOARD (Cached)
-- ============================================

CREATE TABLE event_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES event_registrations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES event_teams(id) ON DELETE CASCADE,
  flight_id UUID REFERENCES flights(id),
  holes_completed SMALLINT DEFAULT 0,
  total_gross SMALLINT,
  total_net SMALLINT,
  total_points DECIMAL(10,2), -- For Stableford
  thru SMALLINT, -- Current hole
  today_gross SMALLINT,
  today_net SMALLINT,
  position SMALLINT,
  position_in_flight SMALLINT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_leaderboard_entry UNIQUE (event_id, registration_id)
);

CREATE INDEX idx_event_leaderboard_event ON event_leaderboard(event_id);

-- ============================================
-- HOLE SPONSORS (For charity events)
-- ============================================

CREATE TABLE hole_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  hole_number SMALLINT NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
  sponsor_name TEXT NOT NULL,
  sponsor_logo_url TEXT,
  sponsor_message TEXT,
  amount_paid DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_hole_sponsor UNIQUE (event_id, hole_number)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tees ENABLE ROW LEVEL SECURITY;
ALTER TABLE holes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hole_yardages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE handicap_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE hole_sponsors ENABLE ROW LEVEL SECURITY;

-- Organizations: public read, owner/admin write
CREATE POLICY "Organizations are viewable by everyone"
  ON organizations FOR SELECT USING (true);

CREATE POLICY "Org admins can update"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Organization Members (uses helper functions to avoid infinite recursion)
CREATE POLICY "Org members are viewable by org members"
  ON organization_members FOR SELECT
  USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org admins can insert members"
  ON organization_members FOR INSERT
  WITH CHECK (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Org admins can update members"
  ON organization_members FOR UPDATE
  USING (is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Org admins can delete members"
  ON organization_members FOR DELETE
  USING (is_org_admin(organization_id, auth.uid()));

-- Facilities: public read
CREATE POLICY "Facilities are viewable by everyone"
  ON facilities FOR SELECT USING (true);

CREATE POLICY "Org admins can manage facilities"
  ON facilities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = facilities.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Tees: public read
CREATE POLICY "Tees are viewable by everyone"
  ON tees FOR SELECT USING (true);

-- Holes: public read
CREATE POLICY "Holes are viewable by everyone"
  ON holes FOR SELECT USING (true);

-- Hole Yardages: public read
CREATE POLICY "Hole yardages are viewable by everyone"
  ON hole_yardages FOR SELECT USING (true);

-- Leagues: public read for org leagues
CREATE POLICY "Leagues are viewable by everyone"
  ON leagues FOR SELECT USING (true);

CREATE POLICY "Org admins can manage leagues"
  ON leagues FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = leagues.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'pro_shop')
    )
  );

-- Seasons
CREATE POLICY "Seasons are viewable by everyone"
  ON seasons FOR SELECT USING (true);

-- League Participants
CREATE POLICY "League participants are viewable by org members"
  ON league_participants FOR SELECT USING (true);

CREATE POLICY "Users can join leagues"
  ON league_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Rounds
CREATE POLICY "Rounds are viewable by everyone"
  ON rounds FOR SELECT USING (true);

-- Round Scores: participants can view and edit own
CREATE POLICY "Round scores are viewable by participants"
  ON round_scores FOR SELECT USING (true);

CREATE POLICY "Participants can enter own scores"
  ON round_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM league_participants
      WHERE league_participants.id = round_scores.participant_id
      AND league_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update own scores"
  ON round_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM league_participants
      WHERE league_participants.id = round_scores.participant_id
      AND league_participants.user_id = auth.uid()
    )
  );

-- Handicap History: users see own
CREATE POLICY "Users can view own handicap history"
  ON handicap_history FOR SELECT
  USING (user_id = auth.uid());

-- League Standings: public read
CREATE POLICY "Standings are viewable by everyone"
  ON league_standings FOR SELECT USING (true);

-- Events: public read, org staff and organizers can manage
CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT USING (true);

CREATE POLICY "Org staff can manage events"
  ON events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = events.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'pro_shop')
    )
  );

CREATE POLICY "Event organizers can update their events"
  ON events FOR UPDATE
  USING (organizer_id = auth.uid());

-- Event Registrations
CREATE POLICY "Event registrations are viewable by participants"
  ON event_registrations FOR SELECT USING (true);

CREATE POLICY "Users can register for events"
  ON event_registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own registration"
  ON event_registrations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Event organizers can manage registrations"
  ON event_registrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Event Teams
CREATE POLICY "Event teams are viewable by everyone"
  ON event_teams FOR SELECT USING (true);

-- Event Team Members
CREATE POLICY "Team members are viewable by everyone"
  ON event_team_members FOR SELECT USING (true);

-- Flights
CREATE POLICY "Flights are viewable by everyone"
  ON flights FOR SELECT USING (true);

-- Event Scores
CREATE POLICY "Event scores are viewable by everyone"
  ON event_scores FOR SELECT USING (true);

CREATE POLICY "Registered users can enter scores"
  ON event_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_registrations
      WHERE event_registrations.id = event_scores.registration_id
      AND event_registrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Registered users can update own scores"
  ON event_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM event_registrations
      WHERE event_registrations.id = event_scores.registration_id
      AND event_registrations.user_id = auth.uid()
    )
  );

-- Event Leaderboard
CREATE POLICY "Leaderboard is viewable by everyone"
  ON event_leaderboard FOR SELECT USING (true);

-- Hole Sponsors
CREATE POLICY "Hole sponsors are viewable by everyone"
  ON hole_sponsors FOR SELECT USING (true);
