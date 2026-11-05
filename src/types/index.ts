export type UserRole = 'admin' | 'member';

export type ConfirmationStatus = 'pending' | 'confirmed' | 'declined';

export type PaymentStatus = 'pending' | 'paid' | 'verified';

export type ExpenseCategory = 
  | 'flight'
  | 'accommodation'
  | 'vehicle'
  | 'food'
  | 'tour'
  | 'other';

export type SplitCriterion = 
  | 'individual'
  | 'equal_all_confirmed'
  | 'equal_custom'
  | 'vehicle_users';

export interface Trip {
  id: string;
  title: string;
  destination: string;
  city?: string;
  state: string;
  country?: string;
  startDate: string;
  endDate: string;
  coverImageUrl: string;
  description: string;
  estimatedBudgetPerPerson: number;
  isArchived?: boolean;
  archivedAt?: string;
}

export interface Participant {
  id: string;
  name: string;
  nickname?: string;
  role: UserRole;
  status: ConfirmationStatus;
  avatarUrl: string;
  phone?: string;
  coupleId?: string;
  confirmedAt?: string;
}

export interface Couple {
  id: string;
  label: string; // ex: "Casal 01"
  memberA: Participant;
  memberB: Participant;
}

export type CoupleStatus = 
  | 'both_confirmed'
  | 'partially_confirmed'
  | 'both_pending'
  | 'both_declined'
  | 'mixed';

export interface Accommodation {
  id: string;
  name: string;
  address: string;
  photos: string[];
  bedroomsCount: number;
  totalCapacity: number;
  totalAmount: number;
  pricePerPersonEstimated: number;
  externalUrl?: string;
  amenities: string[];
  isFavorite?: boolean;
}

export interface Flight {
  id: string;
  airline: string;
  airlineLogoUrl?: string;
  originAirport: string;
  originCity: string;
  destinationAirport: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  flightNumber: string;
  price: number;
  baggageIncluded: boolean;
  purchaseUrl: string;
  type: 'ida' | 'volta';
}

export interface Vehicle {
  id: string;
  model: string;
  category: string;
  passengerCapacity: number;
  luggageCapacity: number;
  dailyRate: number;
  totalDays: number;
  totalAmount: number;
  pickupLocation: string;
  returnLocation: string;
  rentalCompany: string;
  externalUrl?: string;
  imageUrl: string;
  interestedMemberIds: string[];
}

export interface PollOption {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  externalLink?: string;
  voteCount: number;
  percentage: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  category: 'accommodation' | 'vehicle' | 'tour' | 'restaurant' | 'general';
  deadline: string;
  isClosed: boolean;
  allowsChangeVote: boolean;
  totalVotes: number;
  options: PollOption[];
  userVotedOptionId?: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  category: ExpenseCategory;
  totalAmount: number;
  splitCriterion: SplitCriterion;
  participantsCount: number;
  dueDate?: string;
  receiptUrl?: string;
  assignedAmountPerPerson: number;
  involvedParticipantNames: string[];
}

export interface ActivityLog {
  id: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  target: string;
  timestamp: string;
}

