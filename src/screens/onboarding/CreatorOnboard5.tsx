import { useState } from 'react'
import { Instagram, Film, Globe, AtSign, Check, AlertCircle } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { cn, getProfileUrl, normalizeHandle } from '@/utils'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'
import { apiClient } from '@/services/apiClient'
import { OnboardShell } from './OnboardShell'

function validateUrlInput(val: string, domain?: string, required = false): { valid: boolean; normalized: string | null; error?: string } {
  const trimmed = val.trim()
  if (!trimmed) {
    if (required) return { valid: false, normalized: null, error: 'Instagram profile URL is required' }
    return { valid: true, normalized: null }
  }
  if (trimmed.length > 100) {
    return { valid: false, normalized: null, error: 'URL must be 100 characters or less' }
  }
  if (!/^https?:\/\//i.test(trimmed) && !/^www\./i.test(trimmed)) {
    return { valid: false, normalized: null, error: 'URL must start with https:// or www.' }
  }

  let full = trimmed
  if (/^www\./i.test(full)) {
    full = 'https://' + full
  }

  try {
    const parsed = new URL(full)
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return { valid: false, normalized: null, error: 'Please enter a valid web URL' }
    }
    if (domain && !parsed.hostname.toLowerCase().includes(domain.toLowerCase())) {
      return { valid: false, normalized: null, error: `Must be a valid ${domain} link` }
    }
    if (domain && (parsed.pathname === '/' || parsed.pathname === '')) {
      return { valid: false, normalized: null, error: `Please include your profile handle or channel path` }
    }
    return { valid: true, normalized: full }
  } catch {
    return { valid: false, normalized: null, error: 'Invalid URL format' }
  }
}

export function CreatorOnboard5() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const [soc, setSoc] = useState({ ig: '', yt: '', web: '' })
  const [upi, setUpi] = useState('')
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const igStatus = validateUrlInput(soc.ig, 'instagram.com', true)
  const ytStatus = validateUrlInput(soc.yt, 'youtube.com', false)
  const webStatus = validateUrlInput(soc.web, undefined, false)

  // UPI VPA Validation: name@bankhandle (e.g. mobile@paytm or name@okaxis)
  const cleanUpi = upi.trim().toLowerCase()
  const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
  const isValidUpi = UPI_REGEX.test(cleanUpi)

  const submit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    const ob = state.onboard
    const packages = (ob.builtPackages && ob.builtPackages.length > 0)
      ? ob.builtPackages.map(p => ({
          name: p.name || 'Standard Package',
          price: Number(p.price) || 8000,
          duration: p.duration || '2 hours',
          inclusions: p.inclusions || ['High-resolution deliverables'],
          delivery_days: parseInt(p.delivery) || 7,
        }))
      : [{
          name: 'Standard Package',
          price: ob.startingPrice || 8000,
          duration: '2 hours',
          inclusions: ['High-resolution deliverables'],
          delivery_days: 7,
        }]

    try {
      // Single source of truth: Rust Axum backend creates user, creator profile, services & calendar defaults atomically
      await apiClient.onboardCreator({
        name: ob.name || 'Creator',
        handle: ob.handle ? normalizeHandle(ob.handle) : null,
        bio: ob.bio || '',
        discipline: ob.discipline || 'Photography',
        sub_skills: ob.subSkills || [],
        years_exp: ob.yearsExp || 2,
        city: ob.city || 'Delhi',
        languages: (ob.languages as string[]) ?? ['Hindi', 'English'],
        travel_mode: (ob.travelMode as string) ?? 'studio',
        upi_id: cleanUpi,
        instagram_handle: igStatus.normalized!,
        youtube_handle: ytStatus.normalized,
        website_url: webStatus.normalized,
        portfolio_urls: ob.portfolio ?? [],
        packages,
      })

      if (supabaseAvailable && state.supabaseUserId) {
        await authApi.setUserRole('creator').catch(() => {})
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('ftc_saved_session')
          if (state.supabaseUserId) {
            localStorage.removeItem(`ftc_creator_draft_${state.supabaseUserId}`)
          }
        } catch {}
      }

      dispatch({ type: 'SET_ROLE', isCreator: true })
      dispatch({ type: 'MARK_CREATOR' })
      dispatch({ type: 'GO', screen: 'creatorOnboardReview' })
    } catch (e: any) {
      console.error('[FTC] Creator publish failed:', e)
      setSubmitError(e?.message || 'Failed to publish creator profile. Please check connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  type SocKey = 'ig' | 'yt' | 'web'

  const SOCIALS: { k: SocKey; icon: typeof Instagram; label: string; ph: string; req: boolean }[] = [
    { k: 'ig',  icon: Instagram, label: 'Instagram Profile URL', ph: 'https://instagram.com/yourhandle or www...', req: true },
    { k: 'yt',  icon: Film,      label: 'YouTube Channel URL',   ph: 'https://youtube.com/@channel or www...',    req: false },
    { k: 'web', icon: Globe,     label: 'Website / Portfolio',    ph: 'https://yourportfolio.com or www...',       req: false },
  ]

  return (
    <OnboardShell
      step={5} total={5}
      title="Payouts & Verification"
      sub="Link your social profile and specify your UPI ID for escrow payouts."
      onBack={() => dispatch({ type: 'GO', screen: 'creatorOnboard3' })}
      cta={submitting ? 'Publishing profile…' : 'Publish Profile'}
      ctaDisabled={!igStatus.valid || !ytStatus.valid || !webStatus.valid || !isValidUpi || !termsAgreed || submitting}
      ctaAction={submit}
    >
      <div className="space-y-5">
        {submitError && (
          <div className="p-3.5 rounded-2xl bg-danger/10 border border-danger/30 text-danger text-[12.5px] flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Payout Details First */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50 mb-2">Payout Method</div>
          <div className={cn(
            'rounded-2xl border-2 transition p-3.5',
            isValidUpi ? 'border-iris bg-iris-tint/60' : upi.length > 0 ? 'border-danger/60 bg-danger/5' : 'border-line bg-paper'
          )}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-bone grid place-items-center shrink-0 border border-line">
                <AtSign size={16} className={isValidUpi ? 'text-iris' : 'text-obsidian/60'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-obsidian">UPI ID for Payouts</span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold bg-acid text-obsidian">REQUIRED</span>
                  </div>
                  {isValidUpi && <span className="flex items-center gap-1 text-[11px] text-success font-semibold"><Check size={12} strokeWidth={3} /> Valid</span>}
                </div>
                <input
                  value={upi}
                  onChange={e => setUpi(e.target.value)}
                  placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                  className="w-full bg-transparent text-[13px] text-obsidian font-mono outline-none mt-1 placeholder:text-obsidian/30"
                />
              </div>
            </div>
            {upi.length > 0 && !isValidUpi ? (
              <div className="mt-2 text-[11px] text-danger flex items-center gap-1">
                <AlertCircle size={12} /> Please enter a valid UPI VPA (e.g. handle@bank or mobile@paytm)
              </div>
            ) : (
              <div className="mt-2 text-[11px] text-obsidian/50 leading-relaxed">
                Client payments are securely locked in FTC escrow and auto-deposited to this UPI ID upon project completion.
              </div>
            )}
          </div>
        </div>

        {/* Social Profiles */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50 mb-2">Connected Accounts</div>
          <div className="space-y-2">
            {SOCIALS.map(s => {
              const val = soc[s.k]
              const status = s.k === 'ig' ? igStatus : s.k === 'yt' ? ytStatus : webStatus
              const isFilled = val.trim().length > 0 && status.valid
              const hasError = val.trim().length > 0 && !status.valid

              return (
                <div
                  key={s.k}
                  className={cn(
                    'rounded-2xl border-2 transition p-3.5',
                    isFilled ? 'border-iris bg-iris-tint/60' : hasError ? 'border-danger/60 bg-danger/5' : 'border-line bg-paper'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      'w-9 h-9 rounded-xl grid place-items-center shrink-0 transition',
                      isFilled ? 'bg-iris text-paper' : 'bg-bone text-obsidian/60 border border-line'
                    )}>
                      <s.icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-obsidian">{s.label}</span>
                          {s.req ? (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold bg-acid text-obsidian">REQUIRED</span>
                          ) : (
                            <span className="text-[9px] font-mono text-obsidian/40">optional</span>
                          )}
                        </div>
                        {isFilled && <span className="flex items-center gap-1 text-[11px] text-success font-semibold"><Check size={12} strokeWidth={3} /> Valid</span>}
                      </div>
                      <input
                        value={val}
                        maxLength={100}
                        onChange={e => setSoc({ ...soc, [s.k]: e.target.value })}
                        placeholder={s.ph}
                        className="w-full bg-transparent text-[13px] outline-none font-sans text-obsidian placeholder:text-obsidian/30 mt-1"
                      />
                    </div>
                  </div>
                  {hasError && (
                    <div className="mt-1.5 pl-11 text-[11px] text-danger flex items-center gap-1">
                      <AlertCircle size={11} className="shrink-0" />
                      <span>{status.error}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Profile Link Preview Card */}
        <div className="p-4 rounded-2xl bg-obsidian relative overflow-hidden text-paper">
          <div className="text-[10px] font-mono uppercase tracking-wider text-acid">Direct Booking Link</div>
          <div className="font-display text-lg text-paper mt-0.5">
            {getProfileUrl(normalizeHandle(state.onboard.handle || state.onboard.name || 'yourname')).replace(/^https?:\/\//, '')}
          </div>
          <p className="mt-1.5 text-[11px] text-paper/60 leading-relaxed">
            Add this link to your Instagram bio. Clients book directly with FTC Escrow protection — no back-and-forth price bargaining.
          </p>
        </div>

        {/* Clean, High-Trust Legal Consent */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setTermsAgreed(!termsAgreed)}
            className={cn(
              'tap w-full p-4 rounded-2xl border-2 transition flex items-start gap-3 text-left cursor-pointer',
              termsAgreed ? 'border-iris bg-iris-tint/60' : 'border-line bg-paper hover:border-obsidian/30'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-md grid place-items-center shrink-0 border-2 mt-0.5 transition',
              termsAgreed ? 'bg-iris border-iris text-paper' : 'border-obsidian/30 bg-bone'
            )}>
              {termsAgreed && <Check size={12} strokeWidth={3} />}
            </div>
            <div className="flex-1 text-[12.5px] text-obsidian/80 leading-snug">
              <span className="font-semibold text-obsidian">I agree to FTC Creator Terms & Escrow Protection</span>
              <p className="text-[11.5px] text-obsidian/55 mt-0.5">
                By publishing, you agree to fulfill bookings professionally, follow the community code, and receive payouts via FTC secure escrow.
              </p>
            </div>
          </button>
        </div>
      </div>
    </OnboardShell>
  )
}
