import { create } from 'zustand'
import type { AppState, AppAction, Filters, Screen, Tab } from '@/types'
import { CAMPAIGNS, SEED_DEALS, SEED_CREATOR_BOOKINGS, SEED_QUOTES, DEFAULT_FILTERS } from '@/data/constants'

const TAB_SCREENS: Record<Tab, Screen> = {
  home: 'home',
  discover: 'discover',
  inbox: 'inbox',
  me: 'me',
}

const DEFAULT_STATE: AppState = {
  screen: 'welcome',
  prevScreen: null,
  isAuthed: false,
  isCreator: false,
  user: { name: '', city: '', locality: '', email: '', phone: '', handle: '', trustScore: 0 },
  selectedCreatorId: null,
  selectedClient: null,
  bookingDraft: null,
  lastBooking: null,
  viewBooking: null,
  userLoc: null,
  locPerm: 'prompt',
  selectedCampaignId: null,
  compareIds: [],
  saved: ['c1', 'c3', 'c5'],
  filters: DEFAULT_FILTERS,
  viewMode: 'list',
  onboard: {
    name: '', displayName: '', city: '', area: '', bio: '',
    discipline: '', subSkills: [], yearsExp: 3, startingPrice: 8000,
    portfolio: [], idVerified: false, socialProof: false,
  },
  activeTab: 'home',
  drillIntoTab: false,
  sponsorRole: 'creator',
  selectedDealId: null,
  campaigns: CAMPAIGNS,
  deals: SEED_DEALS,
  crmTab: 'inquiry',
  creatorBookings: SEED_CREATOR_BOOKINGS,
  quotes: SEED_QUOTES,
  reviews: [],
  creatorAvailability: { 27: 'booked', 30: 'booked' },
  pendingPhone: null,
  supabaseUserId: null,
  hasCreatorProfile: false,
  onboardOrigin: 'role',
}

function reduce(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'GO':
      return { ...state, prevScreen: state.screen, screen: action.screen }
    case 'GO_TAB':
      return { ...state, prevScreen: state.screen, screen: TAB_SCREENS[action.tab], activeTab: action.tab, drillIntoTab: !!action.viaMenu }
    case 'BACK':
      return { ...state, screen: state.prevScreen ?? TAB_SCREENS[state.activeTab], prevScreen: null, drillIntoTab: false }
    case 'OPEN_CREATOR':
      return { ...state, prevScreen: state.screen, screen: 'creator', selectedCreatorId: action.id, selectedClient: null }
    case 'START_BOOKING':
      return { ...state, prevScreen: state.screen, screen: 'booking', selectedCreatorId: action.draft.creatorId, bookingDraft: action.draft }
    case 'CONFIRM_BOOKING':
      return { ...state, prevScreen: state.screen, screen: 'confirmed', lastBooking: action.booking }
    case 'OPEN_BOOKING':
      return { ...state, prevScreen: state.screen, screen: 'bookingDetail', viewBooking: action.booking }
    case 'SET_LOCATION':
      return { ...state, userLoc: action.coords, locPerm: 'granted' }
    case 'DENY_LOCATION':
      return { ...state, locPerm: 'denied' }
    case 'OPEN_CLIENT_CHAT':
      return { ...state, prevScreen: state.screen, screen: 'chat', selectedClient: action.client }
    case 'OPEN_CAMPAIGN':
      return { ...state, prevScreen: state.screen, screen: 'campaignDetail', selectedCampaignId: action.id }
    case 'TOGGLE_SAVE':
      return { ...state, saved: state.saved.includes(action.id) ? state.saved.filter(x => x !== action.id) : [...state.saved, action.id] }
    case 'TOGGLE_COMPARE': {
      const has = state.compareIds.includes(action.id)
      const next = has ? state.compareIds.filter(x => x !== action.id) : state.compareIds.length < 3 ? [...state.compareIds, action.id] : state.compareIds
      return { ...state, compareIds: next }
    }
    case 'SET_FILTER':
      return { ...state, filters: { ...state.filters, ...action.patch } }
    case 'APPLY_FILTERS':
      return { ...state, filters: action.filters, screen: 'discover', prevScreen: state.screen }
    case 'RESET_FILTERS':
      return { ...state, filters: DEFAULT_FILTERS }
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.mode }
    case 'SET_ONBOARD':
      return { ...state, onboard: { ...state.onboard, ...action.patch } }
    case 'START_CREATOR_ONBOARD':
      return { ...state, prevScreen: state.screen, screen: 'creatorOnboard1', onboardOrigin: action.origin }
    case 'COMPLETE_AUTH':
      return {
        ...state, isAuthed: true,
        isCreator: action.isCreator ?? state.isCreator,
        hasCreatorProfile: action.isCreator ?? state.hasCreatorProfile,
        user: {
          ...state.user,
          name:  action.name  ?? state.user.name,
          city:  action.city  ?? state.user.city,
          email: action.email ?? state.user.email,
          phone: action.phone ?? state.user.phone,
        },
        screen: 'home', activeTab: 'home',
      }
    case 'MARK_CREATOR':
      return { ...state, isCreator: true, hasCreatorProfile: true }
    case 'SET_SPONSOR_ROLE':
      return { ...state, sponsorRole: action.role }
    case 'ADD_CAMPAIGN':
      return { ...state, campaigns: [action.campaign, ...state.campaigns], screen: 'campaigns', activeTab: 'home', prevScreen: null }
    case 'APPLY_SPONSORSHIP':
      return { ...state, deals: [action.deal, ...state.deals], prevScreen: 'campaigns', screen: 'deal', selectedDealId: action.deal.id }
    case 'OPEN_DEAL':
      return { ...state, prevScreen: state.screen, screen: 'deal', selectedDealId: action.id }
    case 'UPDATE_DEAL':
      return { ...state, deals: state.deals.map(d => d.id === action.id ? { ...d, ...action.patch } : d) }
    case 'SET_ROLE':
      if (action.isCreator && !state.hasCreatorProfile) {
        // Not a registered creator yet -> route to Onboarding
        return { ...state, prevScreen: state.screen, screen: 'creatorOnboard1', onboardOrigin: 'me' }
      }
      return { ...state, isCreator: action.isCreator, crmTab: 'inquiry' }
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.patch } }
    case 'SET_CRM_TAB':
      return { ...state, crmTab: action.tab }
    case 'SEND_QUOTE':
      return { ...state, quotes: [...state.quotes, action.quote] }
    case 'QUOTE_ACTION':
      return { ...state, quotes: state.quotes.map(q => q.id === action.id ? { ...q, status: action.status } : q) }
    case 'UPDATE_CREATOR_BOOKING':
      return { ...state, creatorBookings: state.creatorBookings.map(b => b.id === action.id ? { ...b, ...action.patch } : b) }
    case 'ADD_REVIEW':
      return { ...state, reviews: [action.review, ...state.reviews] }
    case 'SET_AVAILABILITY':
      return { ...state, creatorAvailability: { ...state.creatorAvailability, [action.day]: action.value } }
    case 'CLEAR_COMPARE':
      return { ...state, compareIds: [] }
    case 'RESET':
      return DEFAULT_STATE
    case 'SET_PENDING_PHONE':
      return { ...state, pendingPhone: action.phone }
    case 'SYNC_AUTH_USER':
      return {
        ...state,
        isAuthed: true,
        supabaseUserId: action.userId,
        isCreator: action.isCreator ?? state.isCreator,
        hasCreatorProfile: action.isCreator ?? state.hasCreatorProfile,
        user: {
          ...state.user,
          name:  action.name  || state.user.name,
          phone: action.phone || state.user.phone,
          email: action.email || state.user.email,
        },
      }
    default:
      return state
  }
}

function parseInitialHash(defaultState: AppState): AppState {
  if (typeof window === 'undefined') return defaultState

  let baseState = defaultState

  // 1. Try restoring from localStorage session draft
  try {
    const saved = localStorage.getItem('ftc_saved_session')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed === 'object') {
        baseState = {
          ...defaultState,
          screen: parsed.screen || defaultState.screen,
          activeTab: parsed.activeTab || defaultState.activeTab,
          selectedCreatorId: parsed.selectedCreatorId || null,
          onboard: { ...defaultState.onboard, ...(parsed.onboard || {}) },
          isAuthed: parsed.isAuthed ?? defaultState.isAuthed,
          isCreator: parsed.isCreator ?? defaultState.isCreator,
        }
      }
    }
  } catch (e) {
    console.warn('[FTC] Failed to parse saved session from localStorage', e)
  }

  // 2. Auth Tokens in URL (PKCE code or Hash access_token) take highest precedence
  const rawHash = typeof window !== 'undefined' ? window.location.hash : ''
  const rawSearch = typeof window !== 'undefined' ? window.location.search : ''
  const isAuthTokenUrl = rawHash.includes('type=recovery') ||
    rawHash.includes('type=signup') ||
    rawHash.includes('type=magiclink') ||
    rawHash.includes('type=invite') ||
    rawHash.includes('access_token=') ||
    rawSearch.includes('code=')

  if (isAuthTokenUrl) {
    return {
      ...defaultState,
      screen: 'resetPassword',
      isAuthed: false,
    }
  }

  // 3. URL hash overrides localStorage
  const hash = rawHash.replace(/^#/, '')
  if (!hash) return baseState

  const params = new URLSearchParams(hash)
  const creator = params.get('creator')
  const screen = params.get('screen') as Screen | null

  if (screen === 'welcome') {
    try { localStorage.removeItem('ftc_saved_session') } catch {}
    return { ...defaultState, screen: 'welcome', isAuthed: false }
  }

  if (creator) {
    return {
      ...baseState,
      screen: 'creator',
      selectedCreatorId: creator,
    }
  }

  // 4. Final Auth Guard: If not authenticated, only public screens are permitted
  const PUBLIC_AUTH_SCREENS: Screen[] = ['welcome', 'signup', 'login', 'phone', 'otp', 'magicLinkSent', 'forgotPassword', 'resetPassword']
  if (!baseState.isAuthed && !PUBLIC_AUTH_SCREENS.includes(baseState.screen)) {
    try { localStorage.removeItem('ftc_saved_session') } catch {}
    return {
      ...defaultState,
      screen: 'welcome',
      isAuthed: false,
    }
  }

  return baseState
}

function syncUrlHash(state: AppState) {
  if (typeof window === 'undefined') return

  const rawHash = window.location.hash
  const rawSearch = window.location.search
  const hasPendingAuthTokens = rawHash.includes('access_token=') ||
    rawHash.includes('type=recovery') ||
    rawHash.includes('type=signup') ||
    rawHash.includes('type=magiclink') ||
    rawSearch.includes('code=')

  // NEVER overwrite URL while auth tokens or recovery hashes are pending processing
  if (hasPendingAuthTokens && state.screen === 'resetPassword') {
    return
  }

  let nextHash = ''
  if (state.screen === 'creator' && state.selectedCreatorId) {
    nextHash = `creator=${state.selectedCreatorId}`
  } else if (state.screen && state.screen !== 'welcome' && state.screen !== 'home') {
    nextHash = `screen=${state.screen}`
  }
  const currentHash = window.location.hash.replace(/^#/, '')
  if (currentHash !== nextHash) {
    if (nextHash) {
      window.history.replaceState(null, '', `#${nextHash}`)
    } else {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }

  // Persist session state to localStorage unless on welcome/login screen
  try {
    if (state.screen === 'welcome' || !state.isAuthed) {
      localStorage.removeItem('ftc_saved_session')
    } else {
      localStorage.setItem('ftc_saved_session', JSON.stringify({
        screen: state.screen,
        activeTab: state.activeTab,
        selectedCreatorId: state.selectedCreatorId,
        onboard: state.onboard,
        isAuthed: state.isAuthed,
        isCreator: state.isCreator,
      }))
    }
  } catch (e) {
    // Ignore quota errors
  }
}

const INITIAL_STATE = parseInitialHash(DEFAULT_STATE)

interface AppStore extends AppState {
  dispatch: (action: AppAction) => void
  setFilter: (patch: Partial<Filters>) => void
  go: (screen: Screen) => void
  back: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  ...INITIAL_STATE,
  dispatch: (action) => set(state => {
    const next = reduce(state, action)
    syncUrlHash(next)
    return next
  }),
  setFilter: (patch) => set(state => {
    const next = { ...state, filters: { ...state.filters, ...patch } }
    syncUrlHash(next)
    return next
  }),
  go: (screen) => set(state => {
    const next = { ...state, prevScreen: state.screen, screen }
    syncUrlHash(next)
    return next
  }),
  back: () => set(state => {
    const next = { ...state, screen: state.prevScreen ?? TAB_SCREENS[state.activeTab], prevScreen: null }
    syncUrlHash(next)
    return next
  }),
}))

