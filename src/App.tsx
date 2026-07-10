import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { AuthProvider } from '@/components/AuthProvider'
import { BottomNav } from '@/components/ui/BottomNav'
import { WelcomeScreen } from '@/screens/WelcomeScreen'
import { PhoneScreen, OtpScreen, RoleScreen, MagicLinkSentScreen } from '@/screens/AuthScreens'
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
import type { Tab } from '@/types'

const TAB_SCREENS = ['home', 'discover', 'inbox', 'me']

export function App() {
  const { screen, activeTab, dispatch } = useAppStore(useShallow(s => ({
    screen: s.screen,
    activeTab: s.activeTab,
    dispatch: s.dispatch,
  })))

  const showNav = TAB_SCREENS.includes(screen)

  const renderScreen = () => {
    switch (screen) {
      case 'welcome':             return <WelcomeScreen />
      case 'phone':               return <PhoneScreen />
      case 'otp':                 return <OtpScreen />
      case 'magicLinkSent':       return <MagicLinkSentScreen />
      case 'role':                return <RoleScreen />
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
    <AuthProvider>
      <div className="phone-stage">
        <div className="phone">
          <div className="phone-frame">
            <div className="phone-screen">
              {renderScreen()}
            </div>
            {showNav && (
              <BottomNav
                active={activeTab as Tab}
                onNav={(tab) => dispatch({ type: 'GO_TAB', tab })}
              />
            )}
          </div>
        </div>
      </div>
    </AuthProvider>
  )
}
