-- RESET DATABASE
-- Run this to wipe everything, then run 001 and 002 migrations

-- Drop all tables (in order to handle foreign keys)
DROP TABLE IF EXISTS hole_sponsors CASCADE;
DROP TABLE IF EXISTS event_leaderboard CASCADE;
DROP TABLE IF EXISTS event_scores CASCADE;
DROP TABLE IF EXISTS flights CASCADE;
DROP TABLE IF EXISTS event_team_members CASCADE;
DROP TABLE IF EXISTS event_teams CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS league_standings CASCADE;
DROP TABLE IF EXISTS handicap_history CASCADE;
DROP TABLE IF EXISTS round_scores CASCADE;
DROP TABLE IF EXISTS rounds CASCADE;
DROP TABLE IF EXISTS league_participants CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;
DROP TABLE IF EXISTS hole_yardages CASCADE;
DROP TABLE IF EXISTS holes CASCADE;
DROP TABLE IF EXISTS tees CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS game_players CASCADE;
DROP TABLE IF EXISTS game_configs CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop triggers first (in case they exist from old schema)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_games_updated_at ON games;
DROP TRIGGER IF EXISTS update_friendships_updated_at ON friendships;
DROP TRIGGER IF EXISTS update_scores_updated_at ON scores;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_facilities_updated_at ON facilities;
DROP TRIGGER IF EXISTS update_leagues_updated_at ON leagues;
DROP TRIGGER IF EXISTS update_rounds_updated_at ON rounds;
DROP TRIGGER IF EXISTS update_round_scores_updated_at ON round_scores;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_event_registrations_updated_at ON event_registrations;
DROP TRIGGER IF EXISTS update_event_scores_updated_at ON event_scores;

-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS is_org_member(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS is_org_admin(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS add_organization_owner(UUID, UUID) CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS account_type CASCADE;
DROP TYPE IF EXISTS game_format CASCADE;
DROP TYPE IF EXISTS game_status CASCADE;
DROP TYPE IF EXISTS invite_status CASCADE;
DROP TYPE IF EXISTS friendship_status CASCADE;
DROP TYPE IF EXISTS org_role CASCADE;
DROP TYPE IF EXISTS league_type CASCADE;
DROP TYPE IF EXISTS event_format CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS registration_status CASCADE;
DROP TYPE IF EXISTS tee_color CASCADE;
DROP TYPE IF EXISTS event_visibility CASCADE;
DROP TYPE IF EXISTS event_payment_status CASCADE;

-- Drop the trigger on auth.users if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
