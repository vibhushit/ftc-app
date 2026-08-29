export type Tier = 'Platinum' | 'Gold' | 'Silver' | 'Rising'
export type Verification = 'vetted' | 'id' | 'phone'
export type Gender = 'male' | 'female' | 'non-binary'
export type TravelMode = 'studio' | 'travel' | 'both'
export type TravelRadius = 'city' | 'state' | 'nation'
export type Screen =
  | 'welcome' | 'phone' | 'otp' | 'role'
  | 'home' | 'discover' | 'filters' | 'creator'
  | 'booking' | 'confirmed' | 'bookings' | 'bookingDetail'
  | 'campaigns' | 'campaignDetail' | 'deal' | 'campaignCompose'
  | 'inbox' | 'chat'
  | 'me' | 'settings' | 'linkbio'
  | 'creatorOnboard1' | 'creatorOnboard2' | 'creatorOnboard3'
  | 'creatorOnboard4' | 'creatorOnboard5' | 'creatorOnboardReview'
  | 'payouts' | 'payoutSetup'
  | 'saved' | 'reviews' | 'calendar'
  | 'notifications' | 'safety' | 'legal'
  | 'onboardKyc' | 'compare'
  | 'wallet' | 'referral'
  | 'magicLinkSent' | 'forgotPassword' | 'resetPassword'

export type Tab = 'home' | 'discover' | 'inbox' | 'me'

export interface OneOnOne {
  name: string
  mins: number
  price: number
  type: string
  today: boolean
}

export interface Creator {
  id: string
  name: string
  handle: string
  discipline: string
  subSkills: string[]
  city: string
  area: string
  avatar: string
  portfolio: string[]
  rating: number
  reviews: number
  startingAt: number
  yearsExp: number
  completed: number
  rise: string
  tier: Tier
  verification: Verification
  isPro: boolean
  responseTime: string
  nextSlot: string
  languages: string[]
  tagline: string
  availability: number[]
  repeatRate: number
  travelRadius: TravelRadius
  gender: Gender
  trustScore: number
  availableToday: boolean
  travelMode: TravelMode
  oneOnOne: OneOnOne
  lat?: number
  lng?: number
}

export interface Campaign {
  id: string
  kind: 'brand' | 'creator'
  posterName: string
  posterAvatar: string
  posterHandle: string
  posterVerified: boolean
  title: string
  description: string
  discipline: string
  city?: string
  budgetMin: number
  budgetMax: number
  deadline: string
  applicants: number
  saves: number
  hero?: string
  postedAgo: string
}

export interface Deliverable {
  name: string
  done: boolean
  approved: boolean
}

export interface Payment {
  name: string
  amount: number
  status: 'escrow' | 'pending' | 'released'
}

export interface Deal {
  id: string
  campaignId: string
  campaignTitle: string
  brandName: string
  brandAvatar: string
  creatorName: string
  creatorAvatar: string
  creatorId: string
  quote: number
  pitch: string
  stage: 'applied' | 'contract' | 'active' | 'completed'
  deliverables: Deliverable[]
  payments: Payment[]
  agreedDate?: string
  deliveredDate?: string
}

export interface BookingDraft {
  creatorId: string
  creatorName: string
  creatorAvatar: string
  packageName: string
  packagePrice: number
  date: string
  time: string
  location: string
  notes: string
}

export interface Booking {
  id: string
  clientName: string
  clientAvatar: string
  projectType: string
  date: string
  price: number
  advancePaid: number
  status: 'inquiry' | 'upcoming' | 'pending' | 'completed'
}

export interface Quote {
  id: string
  scope: string
  price: number
  delivery: string
  note: string
  status: 'sent' | 'paid' | 'declined'
  createdAt: string
}

export interface Review {
  id: string
  target: string
  rating: number
  categories: Record<string, number>
  text: string
  isPublic: boolean
  photos: number
  createdAt: string
}

export interface User {
  name: string
  city: string
  locality: string
  email: string
  phone: string
  handle?: string
  trustScore?: number
}

export interface Filters {
  discipline: string
  subSkills: string[]
  city: string
  localities: string[]
  languages: string[]
  travel: 'any' | 'travel' | 'studio'
  distance: number
  gender: string
  availableToday: boolean
  budgetMin: number
  budgetMax: number
  rating: number
}

export interface OnboardState {
  name: string
  displayName?: string
  creatorName?: string
  city: string
  area?: string
  bio: string
  discipline: string
  subSkills: string[]
  yearsExp: number
  startingPrice: number
  portfolio: string[]
  idVerified: boolean
  socialProof: boolean
  languages?: string[]
  travelMode?: TravelMode
  workModel?: { studio: boolean; travel: boolean; remote: boolean }
  workDetails?: WorkDetails
  builtPackages?: Package[]
  oneOnOne?: OneOnOne | null
}

export interface WorkDetails {
  studioName: string
  studioAddr: string
  maps: string
  landmark: string
  parking: boolean
  scope: string
  cities: string
  charges: string
  remote: Record<string, boolean>
}

export interface Package {
  id: string
  name: string
  desc: string
  price: number | string
  duration: string
  inclusions: string[]
  revisions: number
  delivery: string
}

export interface ChatMessage {
  id: string
  from: 'me' | 'them'
  text?: string
  time: string
  type?: 'text' | 'quote' | 'booking'
  quoteId?: string
}

export interface ChatThread {
  id: string
  name: string
  avatar: string
  lastMsg: string
  time: string
  unread: number
  online: boolean
}

export interface Notification {
  id: string
  type: string
  group: 'today' | 'week' | 'earlier'
  title: string
  sub: string
  time: string
  urgent?: boolean
  action?: { label: string; screen: Screen; creatorId?: string }
}

export interface AppState {
  screen: Screen
  prevScreen: Screen | null
  isAuthed: boolean
  isCreator: boolean
  user: User
  selectedCreatorId: string | null
  selectedClient: { name: string; avatar: string } | null
  bookingDraft: BookingDraft | null
  lastBooking: Booking | null
  viewBooking: Booking | null
  userLoc: [number, number] | null
  locPerm: 'prompt' | 'granted' | 'denied'
  selectedCampaignId: string | null
  compareIds: string[]
  saved: string[]
  filters: Filters
  viewMode: 'list' | 'map'
  onboard: OnboardState
  activeTab: Tab
  drillIntoTab: boolean
  sponsorRole: 'creator' | 'brand'
  selectedDealId: string | null
  campaigns: Campaign[]
  deals: Deal[]
  crmTab: string
  creatorBookings: Booking[]
  quotes: Quote[]
  reviews: Review[]
  creatorAvailability: Record<number, string | string[]>
  pendingPhone: string | null
  supabaseUserId: string | null
  hasCreatorProfile: boolean
}

export type AppAction =
  | { type: 'GO'; screen: Screen }
  | { type: 'GO_TAB'; tab: Tab; viaMenu?: boolean }
  | { type: 'BACK' }
  | { type: 'OPEN_CREATOR'; id: string }
  | { type: 'START_BOOKING'; draft: BookingDraft }
  | { type: 'CONFIRM_BOOKING'; booking: Booking }
  | { type: 'OPEN_BOOKING'; booking: Booking }
  | { type: 'SET_LOCATION'; coords: [number, number] }
  | { type: 'DENY_LOCATION' }
  | { type: 'OPEN_CLIENT_CHAT'; client: { name: string; avatar: string } }
  | { type: 'OPEN_CAMPAIGN'; id: string }
  | { type: 'TOGGLE_SAVE'; id: string }
  | { type: 'TOGGLE_COMPARE'; id: string }
  | { type: 'SET_FILTER'; patch: Partial<Filters> }
  | { type: 'APPLY_FILTERS'; filters: Filters }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_VIEW_MODE'; mode: 'list' | 'map' }
  | { type: 'SET_ONBOARD'; patch: Partial<OnboardState> }
  | { type: 'COMPLETE_AUTH'; isCreator: boolean; name?: string; city?: string; phone?: string; email?: string }
  | { type: 'MARK_CREATOR' }
  | { type: 'SET_SPONSOR_ROLE'; role: 'creator' | 'brand' }
  | { type: 'ADD_CAMPAIGN'; campaign: Campaign }
  | { type: 'APPLY_SPONSORSHIP'; deal: Deal }
  | { type: 'OPEN_DEAL'; id: string }
  | { type: 'UPDATE_DEAL'; id: string; patch: Partial<Deal> }
  | { type: 'SET_ROLE'; isCreator: boolean }
  | { type: 'UPDATE_USER'; patch: Partial<User> }
  | { type: 'SET_CRM_TAB'; tab: string }
  | { type: 'SEND_QUOTE'; quote: Quote }
  | { type: 'QUOTE_ACTION'; id: string; status: Quote['status'] }
  | { type: 'UPDATE_CREATOR_BOOKING'; id: string; patch: Partial<Booking> }
  | { type: 'ADD_REVIEW'; review: Review }
  | { type: 'SET_AVAILABILITY'; day: number; value: string | string[] }
  | { type: 'CLEAR_COMPARE' }
  | { type: 'RESET' }
  | { type: 'SET_PENDING_PHONE'; phone: string }
  | { type: 'SYNC_AUTH_USER'; userId: string; name: string; phone?: string; email?: string; isCreator?: boolean }
