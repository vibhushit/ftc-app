import { useState } from 'react'
import {
  Check,
  Loader2,
  LogOut,
  Share2,
  Sparkles,
  ArrowRight,
  Calendar,
  Wallet,
  Link2,
  AlertCircle,
} from 'lucide-react'
import { SimpleHeader } from '@/components/ui/SimpleHeader'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { inr } from '@/data/constants'
import { cn, shareOrCopy } from '@/utils'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'
import * as creatorsApi from '@/lib/api/creators'
import { apiClient } from '@/services/apiClient'

/* ─── Settings Screen ─── */
export function SettingsScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const u = state.user ?? {}
  const [name, setName] = useState(u.name ?? '')
  const [city, setCity] = useState(u.city ?? '')
  const initialHandle = (u.handle ?? state.onboard.handle ?? '').replace(/^@+/, '')
  const [handle, setHandle] = useState(initialHandle)
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [handleError, setHandleError] = useState<string | null>(null)
  const [upi, setUpi] = useState((u as any).upiId ?? (state.onboard as any).upiId ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const isC = state.isCreator
  const hasProfile = state.hasCreatorProfile

  const cleanHandle = handle.trim().toLowerCase().replace(/^@+/, '')
  const HANDLE_REGEX = /^[a-zA-Z0-9._]{3,30}$/

  const checkHandleAvailability = async () => {
    if (!cleanHandle) {
      setHandleError('Handle cannot be empty')
      setHandleStatus('idle')
      return false
    }
    if (!HANDLE_REGEX.test(cleanHandle)) {
      setHandleError('Handle must be 3-30 letters, numbers, dots, or underscores')
      setHandleStatus('idle')
      return false
    }
    if (cleanHandle === initialHandle.toLowerCase()) {
      setHandleStatus('available')
      setHandleError(null)
      return true
    }

    setHandleStatus('checking')
    setHandleError(null)
    try {
      const res = await apiClient.checkHandle(cleanHandle)
      if (res.available) {
        setHandleStatus('available')
        setHandleError(null)
        return true
      } else {
        setHandleStatus('taken')
        setHandleError(res.reason || 'This handle is already taken. Try another.')
        return false
      }
    } catch {
      setHandleStatus('available')
      setHandleError(null)
      return true
    }
  }

  const save = async () => {
    setSaving(true)
    setError('')

    // If creator and handle was modified, check handle
    if (hasProfile && cleanHandle && cleanHandle !== initialHandle.toLowerCase()) {
      const ok = await checkHandleAvailability()
      if (!ok) {
        setSaving(false)
        return
      }
    }

    try {
      if (supabaseAvailable) {
        await authApi.updateMyProfile({ name: name.trim(), city: city.trim() })
        if (hasProfile && state.supabaseUserId) {
          await creatorsApi.upsertCreatorProfile({
            id: state.supabaseUserId,
            handle: cleanHandle ? `@${cleanHandle}` : undefined,
            upi_id: upi.trim() || undefined,
            city: city.trim() || undefined,
          })
        }
      }

      dispatch({
        type: 'UPDATE_USER',
        patch: {
          name: name.trim(),
          city: city.trim(),
          handle: cleanHandle ? `@${cleanHandle}` : u.handle,
        },
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      console.error('[FTC] Failed to update profile:', e)
      setError(e?.message || 'Failed to save changes to database')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await authApi.signOutCleanly()
  }

  return (
    <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0">
      <SimpleHeader title="Settings" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 py-4 pb-12 space-y-4 max-w-xl mx-auto w-full">
        {/* Role & Mode Switcher */}
        <div className="rounded-3xl bg-obsidian text-paper p-5 relative overflow-hidden shadow-md">
          <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-acid font-semibold bg-acid/15 px-2.5 py-0.5 rounded-full border border-acid/20">
                Active Account Mode
              </span>
              <span className="text-[12px] font-semibold text-paper/90">
                {isC ? 'Creator Mode' : 'Client Mode'}
              </span>
            </div>

            {hasProfile ? (
              <>
                <p className="text-[12px] text-paper/70 leading-relaxed mb-4">
                  {isC
                    ? 'You are in Creator Mode. You can manage incoming booking requests, your availability calendar, and public packages.'
                    : 'You are in Client Mode. You can browse, bookmark, and book creators across all disciplines.'}
                </p>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_ROLE', isCreator: !isC })}
                  className="tap w-full py-3 rounded-2xl bg-paper/10 hover:bg-paper/20 border border-paper/15 text-[12.5px] font-semibold text-paper flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Sparkles size={14} className="text-acid" />
                  {isC ? 'Switch to Client Mode' : 'Switch to Creator Mode'}
                </button>
              </>
            ) : (
              <>
                <p className="text-[12px] text-paper/70 leading-relaxed mb-4">
                  You are registered as a Client. Become a verified creator on FTC to list packages, sync your calendar, and receive direct client bookings.
                </p>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'START_CREATOR_ONBOARD', origin: 'settings' })}
                  className="tap w-full py-3 rounded-2xl bg-acid text-obsidian text-[12.5px] font-semibold flex items-center justify-center gap-2 transition hover:bg-acid/90 shadow-sm cursor-pointer"
                >
                  <Sparkles size={14} />
                  Become a Creator
                </button>
              </>
            )}
          </div>
        </div>

        {/* Creator Management Shortcuts */}
        {hasProfile && (
          <div className="rounded-2xl bg-paper border border-line p-4 space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-2">Creator Tools</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => dispatch({ type: 'GO', screen: 'calendar' })}
                className="tap p-3 rounded-xl bg-bone hover:bg-obsidian/5 border border-line text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="text-[12px] font-semibold flex items-center gap-1.5">
                    <Calendar size={13} className="text-iris" /> Calendar
                  </div>
                  <div className="text-[10px] text-obsidian/50 mt-0.5">Availability slots</div>
                </div>
                <ArrowRight size={13} className="text-obsidian/30" />
              </button>

              <button
                type="button"
                onClick={() => dispatch({ type: 'GO', screen: 'payouts' })}
                className="tap p-3 rounded-xl bg-bone hover:bg-obsidian/5 border border-line text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="text-[12px] font-semibold flex items-center gap-1.5">
                    <Wallet size={13} className="text-acid-dark" /> Payouts
                  </div>
                  <div className="text-[10px] text-obsidian/50 mt-0.5">Bank & revenue</div>
                </div>
                <ArrowRight size={13} className="text-obsidian/30" />
              </button>

              <button
                type="button"
                onClick={() => dispatch({ type: 'GO', screen: 'linkbio' })}
                className="tap p-3 rounded-xl bg-bone hover:bg-obsidian/5 border border-line text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="text-[12px] font-semibold flex items-center gap-1.5">
                    <Link2 size={13} className="text-obsidian" /> Link-in-Bio
                  </div>
                  <div className="text-[10px] text-obsidian/50 mt-0.5">Public link page</div>
                </div>
                <ArrowRight size={13} className="text-obsidian/30" />
              </button>
            </div>
          </div>
        )}

        {/* Profile Details Box */}
        <div className="rounded-2xl bg-paper border border-line p-4 space-y-3.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-1">
            {hasProfile ? 'Creator Profile Details' : 'Client Profile Details'}
          </div>

          <div>
            <label className="text-[11px] text-obsidian/60 block mb-1">Full name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Rhea Kapoor"
              className="w-full py-2.5 px-3 bg-bone rounded-xl text-[13px] outline-none focus:ring-1 focus:ring-obsidian"
            />
          </div>

          <div>
            <label className="text-[11px] text-obsidian/60 block mb-1">City</label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Delhi NCR, Mumbai"
              className="w-full py-2.5 px-3 bg-bone rounded-xl text-[13px] outline-none focus:ring-1 focus:ring-obsidian"
            />
          </div>

          {hasProfile && (
            <>
              <div>
                <label className="text-[11px] text-obsidian/60 block mb-1">
                  Creator Handle
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative flex items-center">
                    <span className="absolute left-3 text-obsidian/40 font-mono text-[13px]">@</span>
                    <input
                      value={handle}
                      onChange={e => {
                        setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))
                        setHandleStatus('idle')
                        setHandleError(null)
                      }}
                      placeholder="username"
                      className={cn(
                        'w-full py-2.5 pl-7 pr-3 bg-bone rounded-xl text-[13px] font-mono outline-none transition',
                        handleStatus === 'available'
                          ? 'border border-success/40'
                          : handleStatus === 'taken' || handleError
                            ? 'border border-danger/40'
                            : 'focus:ring-1 focus:ring-obsidian'
                      )}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={checkHandleAvailability}
                    disabled={handleStatus === 'checking' || !cleanHandle}
                    className="tap px-3.5 py-2.5 rounded-xl bg-obsidian text-paper text-[12px] font-semibold transition disabled:opacity-40 cursor-pointer"
                  >
                    {handleStatus === 'checking' ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : handleStatus === 'available' ? (
                      <Check size={13} className="text-success" />
                    ) : (
                      'Check'
                    )}
                  </button>
                </div>
                {handleStatus === 'available' && !handleError && (
                  <p className="text-[11px] text-success font-medium mt-1 flex items-center gap-1">
                    <Check size={12} strokeWidth={3} /> Handle is available!
                  </p>
                )}
                {handleError && (
                  <p className="text-[11px] text-danger font-medium mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {handleError}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[11px] text-obsidian/60 block mb-1">UPI ID for Payouts</label>
                <input
                  value={upi}
                  onChange={e => setUpi(e.target.value)}
                  placeholder="name@upi"
                  className="w-full py-2.5 px-3 bg-bone rounded-xl text-[13px] outline-none focus:ring-1 focus:ring-obsidian"
                />
              </div>
            </>
          )}

          {error && <p className="text-[12px] text-danger font-medium">{error}</p>}

          <button
            onClick={save}
            disabled={saving}
            className={cn(
              'tap w-full mt-2 py-3 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 transition shadow-sm cursor-pointer',
              saved ? 'bg-success text-paper' : 'bg-obsidian text-paper hover:bg-obsidian/90 disabled:opacity-50'
            )}
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving changes…</>
            ) : saved ? (
              <><Check size={14} /> Saved to Database ✓</>
            ) : (
              'Save changes'
            )}
          </button>
        </div>

        {/* Account & Session Box */}
        <div className="rounded-2xl bg-paper border border-line p-4 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-1">Account & Session</div>
          <p className="text-[12px] text-obsidian/60">
            Signed in as <span className="font-mono text-obsidian font-semibold">{u.email || u.phone || u.name || 'User'}</span>
          </p>
          <button
            onClick={handleLogout}
            className="tap w-full py-2.5 rounded-xl border border-danger/30 text-danger text-[12.5px] font-semibold hover:bg-danger/10 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={14} /> Log out of this device
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Calendar Screen (Modularized in ./calendar) ─── */
export { CalendarScreen } from './calendar'

/* ─── Payouts Screen ─── */
const PAYOUT_TXNS = [
  { id: 't1', who: 'Priya Joshi job', amount: 30000, dir: 'in' as const, when: 'Apr 22', status: 'released' },
  { id: 't2', who: 'Withdrawal to HDFC ••4821', amount: 28000, dir: 'out' as const, when: 'Apr 20', status: 'paid' },
  { id: 't3', who: 'Karan Bhalla advance', amount: 25000, dir: 'in' as const, when: 'Apr 18', status: 'escrow' },
  { id: 't4', who: 'Nisha Reddy job', amount: 10000, dir: 'in' as const, when: 'Apr 12', status: 'released' },
]

export function PayoutsScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  const [stmt, setStmt] = useState(false)

  return (
    <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0">
      <SimpleHeader title="Revenue & payouts" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 py-4 pb-10 space-y-4 max-w-xl mx-auto w-full">
        <div className="p-5 rounded-3xl bg-obsidian text-paper relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-acid">Available balance</div>
          <div className="font-display text-4xl tnum mt-1 font-light">₹43,000</div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => dispatch({ type: 'GO', screen: 'payoutSetup' })} className="tap flex-1 py-3 rounded-xl bg-acid text-obsidian text-[12.5px] font-semibold">
              Withdraw to bank
            </button>
            <button onClick={() => setStmt(true)} className="tap px-4 py-3 rounded-xl bg-paper/10 text-paper text-[12.5px] font-semibold">
              {stmt ? 'Sent ✓' : 'Statement'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-paper border border-line overflow-hidden p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-3">Transaction history</div>
          <div className="space-y-3">
            {PAYOUT_TXNS.map(t => (
              <div key={t.id} className="flex items-center justify-between gap-3 text-[13px]">
                <div>
                  <div className="font-medium">{t.who}</div>
                  <div className="text-[11px] text-obsidian/45">{t.when}</div>
                </div>
                <div className="text-right">
                  <div className={cn('font-semibold tnum', t.dir === 'in' ? 'text-success' : 'text-obsidian')}>{t.dir === 'in' ? '+' : '-'}{inr(t.amount)}</div>
                  <span className="text-[10px] font-mono text-obsidian/40 uppercase">{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LinkBioScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const [copied, setCopied] = useState(false)
  const u = state.user ?? {}
  const handle = (u as any).handle ? (u as any).handle.replace(/^@/, '') : 'rhea'
  const name = u.name || 'Creator'
  const bioUrl = `https://ftc.app/${handle}`

  const handleShare = async () => {
    const res = await shareOrCopy({
      title: `${name}'s Link-in-Bio on FTC`,
      text: `Book verified photography & videography services directly with ${name}`,
      url: bioUrl,
    })
    if (res === 'copied') {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0">
      <SimpleHeader title="Link-in-Bio" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 py-4 pb-10 space-y-4 max-w-xl mx-auto w-full">
        {/* Active Link Banner */}
        <div className="p-6 rounded-3xl bg-obsidian text-paper relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-acid/20 text-acid border border-acid/30 font-semibold">
              Live & Accepting Bookings
            </span>
            <Sparkles size={16} className="text-acid" />
          </div>

          <div className="font-display text-2xl font-light tracking-tight text-paper">
            Your Personal Booking Link
          </div>
          <p className="text-[12.5px] text-paper/70 mt-1 leading-relaxed">
            Put this in your Instagram bio or send it to clients. They can browse your packages, check availability, and pay with 100% escrow protection.
          </p>

          <div className="mt-5 p-3 rounded-2xl bg-paper/10 border border-paper/15 flex items-center justify-between gap-3">
            <span className="font-mono text-[13px] text-acid truncate font-medium">{bioUrl}</span>
            <button
              onClick={handleShare}
              className="tap px-4 py-2 rounded-xl bg-acid text-obsidian font-semibold text-[12px] flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer hover:bg-acid/90 transition"
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              <span>{copied ? 'Copied ✓' : 'Share Link'}</span>
            </button>
          </div>
        </div>

        {/* Benefits Breakdown */}
        <div className="rounded-2xl bg-paper border border-line p-5 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-2">Why use your FTC link</div>
          <div className="flex items-start gap-3 text-[13px]">
            <span className="text-base leading-none shrink-0">⚡</span>
            <div>
              <div className="font-semibold text-obsidian">0% Commission on Direct Clients</div>
              <div className="text-obsidian/60 text-[12px]">When clients book via your link-in-bio, you keep 100% of your listed rate.</div>
            </div>
          </div>
          <div className="flex items-start gap-3 text-[13px] pt-2 border-t border-line/60">
            <span className="text-base leading-none shrink-0">🛡️</span>
            <div>
              <div className="font-semibold text-obsidian">Guaranteed Escrow Advance</div>
              <div className="text-obsidian/60 text-[12px]">No more chasing invoices or phantom cancellations. Funds are held safely before the shoot.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PayoutSetupScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <SimpleHeader title="Payout Setup" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll p-5">
        <div className="p-6 rounded-2xl bg-paper border border-line">
          <div className="font-display text-xl">Bank Account & UPI</div>
          <div className="text-sm text-obsidian/60 mt-1">HDFC Bank •••• 4821 (Verified)</div>
        </div>
      </div>
    </div>
  )
}
