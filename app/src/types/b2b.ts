// B2B Types for Fore - Organizations, Leagues, Events, Courses

export type OrgRole = 'owner' | 'admin' | 'pro_shop' | 'member';
export type LeagueType = 'weekly' | 'seasonal' | 'tournament';
export type EventFormat = 'stroke_play' | 'match_play' | 'scramble' | 'best_ball' | 'shamble' | 'stableford';
export type EventStatus = 'draft' | 'open' | 'closed' | 'in_progress' | 'completed' | 'cancelled';
export type RegistrationStatus = 'pending' | 'confirmed' | 'waitlisted' | 'cancelled';
export type EventVisibility = 'private' | 'link' | 'public';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'not_required';
export type TeeColor = 'black' | 'blue' | 'white' | 'gold' | 'red';

// ============================================
// Organizations
// ============================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  timezone: string;
  stripe_customer_id: string | null;
  subscription_tier: string;
  subscription_status: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  member_number: string | null;
  joined_at: string;
  created_at: string;
}

// ============================================
// Facilities & Courses
// ============================================

export interface Facility {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  holes: 9 | 18;
  par: number | null;
  slope_rating: number | null;
  course_rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface Tee {
  id: string;
  facility_id: string;
  name: string;
  color: TeeColor | null;
  total_yards: number | null;
  slope_rating: number | null;
  course_rating: number | null;
  created_at: string;
}

export interface Hole {
  id: string;
  facility_id: string;
  hole_number: number;
  par: number;
  handicap_index: number | null;
  created_at: string;
}

export interface HoleYardage {
  id: string;
  hole_id: string;
  tee_id: string;
  yards: number;
}

// ============================================
// Leagues
// ============================================

export interface LeagueSettings {
  handicap_mode?: 'none' | 'user_entered' | 'established' | 'league_rounds';
  handicap_rounds?: number | null;
  max_handicap?: number;
  scoring_type?: 'net' | 'gross' | 'both';
  points_system?: 'none' | 'weekly' | 'match' | 'quota';
  team_format?: 'individual' | 'fixed' | 'blind_draw' | 'abcd';
  players_per_team?: number | null;
  use_divisions?: boolean;
  number_of_divisions?: number | null;
  players_per_division?: number | null;
  division_type?: 'handicap' | 'random' | 'manual' | null;
  number_of_weeks?: number;
  holes_per_round?: number;
  drop_worst_rounds?: number;
  allow_subs?: boolean;
  track_skins?: boolean;
  skin_value?: number | null;
  track_closest_to_pin?: boolean;
  track_long_drive?: boolean;
  weekly_fee?: number | null;
  prize_pool?: number | null;
  payout_places?: number;
}

export interface League {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  league_type: LeagueType;
  format: EventFormat;
  day_of_week: number | null;
  start_time: string | null;
  max_players: number | null;
  handicap_percentage: number;
  entry_fee: number | null;
  settings: LeagueSettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Season {
  id: string;
  league_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface LeagueParticipant {
  id: string;
  season_id: string;
  user_id: string;
  handicap_at_start: number | null;
  team_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Round {
  id: string;
  season_id: string;
  facility_id: string | null;
  round_number: number;
  scheduled_date: string;
  tee_time: string | null;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoundScore {
  id: string;
  round_id: string;
  participant_id: string;
  hole_number: number;
  strokes: number | null;
  created_at: string;
  updated_at: string;
}

export interface LeagueStanding {
  id: string;
  season_id: string;
  participant_id: string;
  rounds_played: number;
  total_points: number;
  total_gross: number;
  total_net: number;
  average_gross: number | null;
  average_net: number | null;
  current_handicap: number | null;
  rank: number | null;
  updated_at: string;
}

export interface HandicapHistory {
  id: string;
  user_id: string;
  organization_id: string | null;
  handicap_index: number;
  effective_date: string;
  rounds_used: number | null;
  calculation_details: Record<string, unknown> | null;
  created_at: string;
}

// ============================================
// Events (Outings/Tournaments)
// ============================================

export interface EventSettings {
  // Scoring
  scoring_type?: 'net' | 'gross' | 'both';
  use_handicaps?: boolean;
  handicap_allowance?: number; // Percentage of handicap to use
  max_handicap?: number;

  // Teams
  team_format?: 'individual' | 'scramble' | 'best_ball' | 'shamble' | 'alternate_shot';
  allow_incomplete_teams?: boolean;

  // Flights/Divisions
  use_flights?: boolean;
  flight_count?: number;
  flight_assignment?: 'handicap' | 'age' | 'manual';

  // Competition features
  track_skins?: boolean;
  skins_type?: 'gross' | 'net';
  skins_value?: number;
  track_closest_to_pin?: boolean;
  ctp_holes?: number[]; // Which holes have CTP
  track_long_drive?: boolean;
  long_drive_holes?: number[]; // Which holes have long drive

  // Mulligans & extras
  allow_mulligans?: boolean;
  mulligan_price?: number;
  max_mulligans?: number;

  // Prizes
  payout_places?: number;
  payout_percentages?: number[]; // e.g., [50, 30, 20]

  // Rules
  preferred_lies?: boolean;
  max_score_per_hole?: number; // e.g., double par

  // Food & extras
  includes_food?: boolean;
  includes_cart?: boolean;
  includes_range?: boolean;
}

export interface Event {
  id: string;
  organization_id: string;
  facility_id: string | null;
  organizer_id: string | null; // Player account who manages this event
  slug: string | null; // URL slug for /[org-slug]/[event-slug]
  name: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  format: EventFormat;
  status: EventStatus;
  visibility: EventVisibility;
  max_players: number | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  entry_fee: number | null; // What players pay to organizer
  course_fee: number | null; // What course takes (set by course admin)
  team_size: number;
  handicap_percentage: number;
  flights_enabled: boolean;
  shotgun_start: boolean;
  prize_pool: number | null;
  prize_structure: Record<string, unknown> | null;
  sponsors: Record<string, unknown>[] | null;
  cover_image_url: string | null;
  settings: EventSettings;
  organizer_can_configure: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string | null; // NULL for guest registrations
  guest_name: string | null; // Name for guests without accounts
  guest_email: string | null; // Email for guests (used to claim registration)
  team_name: string | null;
  status: RegistrationStatus;
  handicap_at_registration: number | null;
  flight_id: string | null;
  group_number: number | null; // For shotgun start groupings (1, 2, 3, etc.)
  tee_time: string | null;
  starting_hole: number | null; // Which hole the group starts on
  payment_status: PaymentStatus;
  payment_id: string | null;
  notes: string | null;
  invited_by: string | null; // User ID of who invited this player
  checked_in: boolean; // Has player checked in for event day
  checked_in_at: string | null; // When player checked in
  registered_at: string;
  created_at: string;
  updated_at: string;
}

export interface EventTeam {
  id: string;
  event_id: string;
  name: string;
  captain_id: string | null;
  created_at: string;
}

export interface EventTeamMember {
  id: string;
  team_id: string;
  registration_id: string;
  created_at: string;
}

export interface Flight {
  id: string;
  event_id: string;
  name: string;
  min_handicap: number | null;
  max_handicap: number | null;
  sort_order: number;
  created_at: string;
}

export interface EventScore {
  id: string;
  event_id: string;
  registration_id: string;
  team_id: string | null;
  hole_number: number;
  strokes: number | null;
  team_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface EventLeaderboard {
  id: string;
  event_id: string;
  registration_id: string | null;
  team_id: string | null;
  flight_id: string | null;
  holes_completed: number;
  total_gross: number | null;
  total_net: number | null;
  total_points: number | null;
  thru: number | null;
  today_gross: number | null;
  today_net: number | null;
  position: number | null;
  position_in_flight: number | null;
  updated_at: string;
}

export interface HoleSponsor {
  id: string;
  event_id: string;
  hole_number: number;
  sponsor_name: string;
  sponsor_logo_url: string | null;
  sponsor_message: string | null;
  amount_paid: number | null;
  created_at: string;
}

// ============================================
// Extended/Joined Types
// ============================================

export interface OrganizationWithMembers extends Organization {
  members: (OrganizationMember & { profile: import('./database').Profile })[];
}

export interface FacilityWithDetails extends Facility {
  tees: Tee[];
  holeDetails: (Hole & { yardages: HoleYardage[] })[];
}

export interface LeagueWithSeasons extends League {
  organization: Organization;
  seasons: Season[];
}

export interface SeasonWithDetails extends Season {
  league: League;
  participants: (LeagueParticipant & { profile: import('./database').Profile })[];
  rounds: Round[];
  standings: LeagueStanding[];
}

export interface EventWithDetails extends Event {
  organization: Organization;
  facility: Facility | null;
  flights: Flight[];
  registrations: (EventRegistration & { profile: import('./database').Profile })[];
  holeSponsorDetails: HoleSponsor[];
}

// ============================================
// Input Types
// ============================================

export interface CreateOrganizationInput {
  name: string;
  slug?: string;
  description?: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface CreateFacilityInput {
  organization_id: string;
  name: string;
  holes: 9 | 18;
  par?: number;
  slope_rating?: number;
  course_rating?: number;
}

export interface CreateLeagueInput {
  organization_id: string;
  name: string;
  description?: string;
  league_type: LeagueType;
  format: EventFormat;
  day_of_week?: number;
  start_time?: string;
  max_players?: number;
  entry_fee?: number;
  handicap_percentage?: number;
  settings?: LeagueSettings;
}

export interface CreateEventInput {
  organization_id: string;
  facility_id?: string;
  organizer_email?: string; // Email of player to assign as organizer
  name?: string; // Optional - organizer can set this
  description?: string;
  event_date: string;
  start_time?: string;
  format?: EventFormat;
  course_fee?: number; // What the course takes
  max_players?: number;
  entry_fee?: number;
  team_size?: number;
  handicap_percentage?: number;
  flights_enabled?: boolean;
  shotgun_start?: boolean;
  prize_pool?: number;
  settings?: EventSettings;
  organizer_can_configure?: boolean; // If true, organizer sets most settings
}

// Input for organizer to update their event details
export interface UpdateEventOrganizerInput {
  name?: string;
  slug?: string;
  description?: string;
  visibility?: EventVisibility;
  max_players?: number;
  entry_fee?: number;
  registration_closes_at?: string;
  team_size?: number;
  handicap_percentage?: number;
  cover_image_url?: string;
}
