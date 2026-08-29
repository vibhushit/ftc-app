import { useEffect } from 'react'
import { useShallow } from 'zustand/shallow'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/appStore'
import { AuthProvider } from '@/components/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { EnvironmentSwitcher } from '@/components/ui/EnvironmentSwitcher'
import { NetworkStatusBanner } from '@/components/ui/NetworkStatusBanner'
import { BottomNav } from '@/components/ui/BottomNav'
import { SideNav } from '@/components/ui/SideNav'
import { WelcomeScreen } from '@/screens/WelcomeScreen'
import { PhoneScreen, LoginScreen, SignUpScreen, OtpScreen, RoleScreen, ClientOnboardScreen, MagicLinkSentScreen, ForgotPasswordScreen, ResetPasswordScreen } from '@/screens/AuthScreens'
import { HomeScreen } from '@/screens/HomeScreen'
import { DiscoverScreen } from '@/screens/DiscoverScreen'
import { CreatorDetailScreen } from '@/screens/CreatorDetailScreen'
import { BookingScreen, ConfirmedScreen, BookingsScreen, BookingDetailScreen } from '@/screens/BookingScreens'
import { CreatorOnboard1, CreatorOnboard2, CreatorOnboard3, CreatorOnboard4, CreatorOnboard5, CreatorOnboardReview } from '@/screens/OnboardingScreens'
import { ChatScreen } from '@/screens/ChatScreen'
import { SafetyScreen, LegalScreen, CompareScreen, ReviewsScreen, WalletScreen, ReferralScreen, OnboardKycScreen } from '@/screens/MiscScreens'
import { SettingsScreen, LinkBioScreen, CalendarScreen, PayoutsScreen, PayoutSetupScreen } from '@/screens/SettingsScreens'
import { SponsorshipsScreen, SponsorshipDetailScreen, DealScreen, SponsorComposeScreen } from '@/screens/SponsorshipScreens'
import {
  InboxScreen,
  MeScreen,
  FiltersScreen,
  NotificationsScreen,
  SavedScreen,
} from '@/screens/StubScreens'
import { cn } from '@/utils'
import type { Tab, Screen } from '@/types'

const TAB_SCREENS: Screen[] = ['home', 'discover', 'inbox', 'me']
const WIDE_SCREENS: Screen[] = ['home', 'discover', 'inbox', 'me', 'saved', 'campaigns', 'creator', 'booking', 'bookingDetail', 'campaignDetail', 'bookings', 'compare', 'chat', 'calendar']

// Public screens accessible without authentication
const PUBLIC_SCREENS: Screen[] = [
  'welcome', 'signup', 'login', 'phone', 'otp', 'magicLinkSent', 'forgotPassword', 'resetPassword',
]

// Dedicated wizard screens where the app shell (sidebar/bottom nav) is hidden
const NO_SHELL_SCREENS: Screen[] = [
  'welcome', 'signup', 'login', 'phone', 'otp', 'magicLinkSent', 'forgotPassword', 'resetPassword', 'role', 'clientOnboard',
  'creatorOnboard1', 'creatorOnboard2', 'creatorOnboard3', 'creatorOnboard4', 'creatorOnboard5', 'creatorOnboardReview',
]

export function App() {
  const { screen, activeTab, isAuthed, dispatch } = useAppStore(useShallow(s => ({
    screen: s.screen,
    activeTab: s.activeTab,
    isAuthed: s.isAuthed,
    dispatch: s.dispatch,
  })))

  const isPublicScreen = PUBLIC_SCREENS.includes(screen)

  // ─── Route Guard: If unauthenticated visitor tries to access protected screens ───
  useEffect(() => {
    if (!isAuthed && !isPublicScreen) {
      dispatch({ type: 'RESET' })
    }
  }, [isAuthed, isPublicScreen, dispatch])

  // ─── Browser History Sync (Back / Forward Button & Swipe Support) ───
  useEffect(() => {
    const handlePopState = () => {
      const rawHash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : ''
      const params = new URLSearchParams(rawHash)
      const creatorId = params.get('creator')
      const screenParam = params.get('screen') as Screen | null

      if (creatorId) {
        dispatch({
          type: 'POP_STATE',
          screen: 'creator',
          selectedCreatorId: creatorId,
        })
        return
      }

      if (screenParam) {
        const validTabs: Tab[] = ['home', 'discover', 'inbox', 'me']
        const matchingTab = validTabs.find(t => t === screenParam)
        dispatch({
          type: 'POP_STATE',
          screen: screenParam,
          activeTab: matchingTab,
        })
        return
      }

      // Hash is empty -> restore home if authed, else welcome
      const authed = useAppStore.getState().isAuthed
      dispatch({
        type: 'POP_STATE',
        screen: authed ? 'home' : 'welcome',
        activeTab: 'home',
      })
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [dispatch])

  const showBottomNav = isAuthed && TAB_SCREENS.includes(screen)
  const showSideNav = isAuthed && !NO_SHELL_SCREENS.includes(screen)
  const isWide = WIDE_SCREENS.includes(screen)

  const renderScreen = () => {
    // Strict Guard: If not authenticated and attempting to view internal screen, render WelcomeScreen
    if (!isAuthed && !isPublicScreen) {
      return <WelcomeScreen />
    }

    switch (screen) {
      case 'welcome':             return <WelcomeScreen />
      case 'signup':              return <SignUpScreen />
      case 'login':               return <LoginScreen />
      case 'phone':               return <PhoneScreen />
      case 'otp':                 return <OtpScreen />
      case 'magicLinkSent':       return <MagicLinkSentScreen />
      case 'forgotPassword':      return <ForgotPasswordScreen />
      case 'resetPassword':       return <ResetPasswordScreen />
      case 'role':                return <RoleScreen />
      case 'clientOnboard':       return <ClientOnboardScreen />
      case 'home':                return <HomeScreen />
      case 'discover':            return <DiscoverScreen />
      case 'inbox':               return <InboxScreen />
      case 'me':                  return <MeScreen />
      case 'creator':             return <CreatorDetailScreen />
      case 'booking':             return <BookingScreen />
      case 'confirmed':           return <ConfirmedScreen />
      case 'bookings':            return <BookingsScreen />
      case 'bookingDetail':       return <BookingDetailScreen />
      case 'chat':                return <ChatScreen />
      case 'campaigns':           return <SponsorshipsScreen />
      case 'campaignDetail':      return <SponsorshipDetailScreen />
      case 'deal':                return <DealScreen />
      case 'campaignCompose':     return <SponsorComposeScreen />
      case 'filters':             return <FiltersScreen />
      case 'notifications':       return <NotificationsScreen />
      case 'saved':               return <SavedScreen />
      case 'reviews':             return <ReviewsScreen />
      case 'safety':              return <SafetyScreen />
      case 'legal':               return <LegalScreen />
      case 'compare':             return <CompareScreen />
      case 'settings':            return <SettingsScreen />
      case 'linkbio':             return <LinkBioScreen />
      case 'calendar':            return <CalendarScreen />
      case 'payouts':             return <PayoutsScreen />
      case 'payoutSetup':         return <PayoutSetupScreen />
      case 'wallet':              return <WalletScreen />
      case 'referral':            return <ReferralScreen />
      case 'onboardKyc':          return <OnboardKycScreen />
      case 'creatorOnboard1':     return <CreatorOnboard1 />
      case 'creatorOnboard2':     return <CreatorOnboard2 />
      case 'creatorOnboard3':     return <CreatorOnboard3 />
      case 'creatorOnboard4':     return <CreatorOnboard4 />
      case 'creatorOnboard5':     return <CreatorOnboard5 />
      case 'creatorOnboardReview':return <CreatorOnboardReview />
      default: return (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="text-4xl mb-4">🚧</div>
          <div className="font-display text-xl">Screen: <code className="text-iris">{screen}</code></div>
          <p className="text-[13px] text-obsidian/50 mt-1">This screen is coming soon.</p>
          <button
            onClick={() => dispatch({ type: 'BACK' })}
            className="tap mt-4 px-5 py-3 rounded-2xl bg-obsidian text-paper text-[14px] font-semibold"
          >
            ← Back
          </button>
        </div>
      )
    }
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NetworkStatusBanner />
        <EnvironmentSwitcher />
        <div className="app-shell">
          {showSideNav && (
            <SideNav
              active={activeTab as Tab}
              onNav={(tab) => dispatch({ type: 'GO_TAB', tab })}
            />
          )}
          <div className={cn('app-main', isWide && 'app-main--wide')}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={screen}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                className="flex-1 flex flex-col min-h-0 min-w-0"
              >
                {renderScreen()}
              </motion.div>
            </AnimatePresence>
            {showBottomNav && (
              <BottomNav
                active={activeTab as Tab}
                onNav={(tab) => dispatch({ type: 'GO_TAB', tab })}
              />
            )}
          </div>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  )
}
