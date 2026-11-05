/**
 * Tipos TypeScript do banco de dados — Rota de Verão
 * Espelha o schema PostgreSQL definido em supabase/migrations/001_schema_completo.sql
 */

// ─── ENUMs ────────────────────────────────────────────────────

export type UserRole = 'admin' | 'member';
export type ConfirmationStatus = 'pending' | 'confirmed' | 'declined';
export type PaymentStatus = 'pending' | 'paid' | 'verified';
export type ExpenseCategory = 'flight' | 'accommodation' | 'vehicle' | 'food' | 'tour' | 'other';
export type SplitCriterion = 'individual' | 'equal_all_confirmed' | 'equal_custom' | 'vehicle_users';
export type PollCategory = 'accommodation' | 'vehicle' | 'tour' | 'restaurant' | 'general';
export type NotificationType = 'poll_created' | 'trip_updated' | 'price_alert' | 'expense_added' | 'system';
export type FlightType = 'ida' | 'volta';
export type CoupleStatus = 'confirmed' | 'declined' | 'partial' | 'pending';

// ─── TABELAS (tipos das linhas do banco como type aliases) ────

export type Profile = {
  id: string;
  full_name: string;
  nickname: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Trip = {
  id: string;
  title: string;
  destination: string;
  city?: string | null;
  state: string | null;
  country?: string | null;
  start_date: string;
  end_date: string;
  cover_image_url: string | null;
  description: string | null;
  estimated_budget_per_person: number | null;
  is_archived?: boolean;
  archived_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Couple = {
  id: string;
  trip_id: string;
  label: string;
  member_a_id: string;
  member_b_id: string;
  created_at: string;
};

export type TripMember = {
  id: string;
  trip_id: string;
  profile_id: string;
  role: UserRole;
  confirmation_status: ConfirmationStatus;
  couple_id: string | null;
  confirmed_at: string | null;
  created_at: string;
};

export type Invitation = {
  id: string;
  trip_id: string;
  profile_id: string;
  pin_hash: string;
  token: string;
  expires_at: string;
  is_revoked: boolean;
  last_used_at: string | null;
  created_at: string;
};

export type Accommodation = {
  id: string;
  trip_id: string;
  name: string;
  address: string | null;
  photos: string[];
  bedrooms_count: number;
  total_capacity: number;
  total_amount: number;
  price_per_person_estimated: number | null;
  external_url: string | null;
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
};

export type Flight = {
  id: string;
  trip_id: string;
  airline: string;
  origin_airport: string;
  origin_city: string | null;
  destination_airport: string;
  destination_city: string | null;
  departure_time: string;
  arrival_time: string;
  flight_number: string | null;
  price: number;
  baggage_included: boolean;
  purchase_url: string | null;
  type: FlightType;
  created_at: string;
};

export type Vehicle = {
  id: string;
  trip_id: string;
  model: string;
  category: string;
  passenger_capacity: number;
  luggage_capacity: number;
  daily_rate: number;
  total_days: number;
  total_amount: number;
  pickup_location: string;
  return_location: string;
  rental_company: string | null;
  external_url: string | null;
  image_url: string | null;
  created_at: string;
};

export type VehicleInterest = {
  id: string;
  vehicle_id: string;
  trip_member_id: string;
  created_at: string;
};

export type Poll = {
  id: string;
  trip_id: string;
  title: string;
  description: string | null;
  category: PollCategory;
  allows_change_vote: boolean;
  is_closed: boolean;
  deadline: string | null;
  created_at: string;
};

export type PollOption = {
  id: string;
  poll_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  external_link: string | null;
  accommodation_id: string | null;
  vehicle_id: string | null;
  created_at: string;
};

export type PollVote = {
  id: string;
  poll_id: string;
  poll_option_id: string;
  trip_member_id: string;
  created_at: string;
  updated_at: string;
};

export type CostItem = {
  id: string;
  trip_id: string;
  title: string;
  category: ExpenseCategory;
  total_amount: number;
  split_criterion: SplitCriterion;
  vehicle_id: string | null;
  receipt_url: string | null;
  notes: string | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
};

export type CostParticipant = {
  id: string;
  cost_item_id: string;
  trip_member_id: string;
  assigned_amount: number;
  payment_status: PaymentStatus;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  trip_id: string;
  actor_id: string;
  action: string;
  entity_name: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

// ─── VIEWS ────────────────────────────────────────────────────

export type CoupleStatusView = {
  couple_id: string;
  trip_id: string;
  label: string;
  member_a_id: string;
  member_b_id: string;
  member_a_name: string;
  member_b_name: string;
  member_a_nickname: string | null;
  member_b_nickname: string | null;
  member_a_avatar: string | null;
  member_b_avatar: string | null;
  member_a_status: ConfirmationStatus;
  member_b_status: ConfirmationStatus;
  couple_status: CoupleStatus;
};

// ─── TIPOS COMPOSTOS ──────────────────────────────────────────

export type TripMemberWithProfile = TripMember & {
  profile: Profile;
};

export type PollOptionWithVotes = PollOption & {
  vote_count: number;
  percentage: number;
  user_voted: boolean;
};

export type PollWithOptions = Poll & {
  options: PollOptionWithVotes[];
};

export type CostParticipantWithMember = CostParticipant & {
  member: TripMemberWithProfile;
};

export type CostItemWithParticipants = CostItem & {
  participants: CostParticipantWithMember[];
};

export type VehicleWithInterests = Vehicle & {
  interests: VehicleInterest[];
  interested_members: TripMemberWithProfile[];
};

// ─── GENERIC RELATIONSHIP TYPE ────────────────────────────────

export type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

// ─── DEFINIÇÃO PARA O CLIENTE SUPABASE ─────────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile>; Relationships: GenericRelationship[]; };
      trips: { Row: Trip; Insert: Partial<Trip>; Update: Partial<Trip>; Relationships: GenericRelationship[]; };
      couples: { Row: Couple; Insert: Partial<Couple>; Update: Partial<Couple>; Relationships: GenericRelationship[]; };
      trip_members: { Row: TripMember; Insert: Partial<TripMember>; Update: Partial<TripMember>; Relationships: GenericRelationship[]; };
      invitations: { Row: Invitation; Insert: Partial<Invitation>; Update: Partial<Invitation>; Relationships: GenericRelationship[]; };
      accommodations: { Row: Accommodation; Insert: Partial<Accommodation>; Update: Partial<Accommodation>; Relationships: GenericRelationship[]; };
      flights: { Row: Flight; Insert: Partial<Flight>; Update: Partial<Flight>; Relationships: GenericRelationship[]; };
      vehicles: { Row: Vehicle; Insert: Partial<Vehicle>; Update: Partial<Vehicle>; Relationships: GenericRelationship[]; };
      vehicle_interests: { Row: VehicleInterest; Insert: Partial<VehicleInterest>; Update: Partial<VehicleInterest>; Relationships: GenericRelationship[]; };
      polls: { Row: Poll; Insert: Partial<Poll>; Update: Partial<Poll>; Relationships: GenericRelationship[]; };
      poll_options: { Row: PollOption; Insert: Partial<PollOption>; Update: Partial<PollOption>; Relationships: GenericRelationship[]; };
      poll_votes: { Row: PollVote; Insert: Partial<PollVote>; Update: Partial<PollVote>; Relationships: GenericRelationship[]; };
      cost_items: { Row: CostItem; Insert: Partial<CostItem>; Update: Partial<CostItem>; Relationships: GenericRelationship[]; };
      cost_participants: { Row: CostParticipant; Insert: Partial<CostParticipant>; Update: Partial<CostParticipant>; Relationships: GenericRelationship[]; };
      activity_logs: { Row: ActivityLog; Insert: Partial<ActivityLog>; Update: Partial<ActivityLog>; Relationships: GenericRelationship[]; };
    };
    Views: {
      couple_status_view: { Row: CoupleStatusView; Relationships: GenericRelationship[]; };
    };
    Functions: {
      is_trip_admin: { Args: { p_trip_id: string }; Returns: boolean; };
      is_trip_member: { Args: { p_trip_id: string }; Returns: boolean; };
    };
  };
};
