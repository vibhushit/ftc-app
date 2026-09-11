import { useState } from 'react'
import {
  Check,
  Loader2,
  LogOut,
  Share2,
  Sparkles,
} from 'lucide-react'
import { SimpleHeader } from '@/components/ui/SimpleHeader'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { inr } from '@/data/constants'
import { cn, shareOrCopy } from '@/utils'
import { supabase, supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'

/* ─── Settings Screen ─── */
export function SettingsScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const u = state.user ?? {}
  const [name, setName] = useState(u.name ?? '')
  const [city, setCity] = useState(u.city ?? '')
  const [handle, setHandle] = useState(u.handle ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      if (supabaseAvailable) {
        await authApi.updateMyProfile({ name: name.trim(), city: city.trim() })
      }
      dispatch({ type: 'UPDATE_USER', patch: { name: name.trim(), city: city.trim(), handle: handle.trim() } })
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
    try {
      if (supabaseAvailable) {
        await supabase.auth.signOut()
      }
    } catch (e) {
      console.warn('[FTC] signOut error:', e)
    }
    try {
      localStorage.removeItem('ftc_saved_session')
    } catch {}
    dispatch({ type: 'RESET' })
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0">
      <SimpleHeader title="Settings" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 py-4 pb-10 space-y-4 max-w-xl mx-auto w-full">
        <div className="rounded-2xl bg-paper border border-line p-4 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-1">Profile details</div>
          <div>
            <label className="text-[11px] text-obsidian/60">Full name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Rhea Kapoor"
              className="mt-1 w-full py-2.5 px-3 bg-bone rounded-xl text-[13px] outline-none focus:ring-1 focus:ring-obsidian"
            />
          </div>
          <div>
            <label className="text-[11px] text-obsidian/60">City</label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Delhi NCR, Mumbai"
              className="mt-1 w-full py-2.5 px-3 bg-bone rounded-xl text-[13px] outline-none focus:ring-1 focus:ring-obsidian"
            />
          </div>
          <div>
            <label className="text-[11px] text-obsidian/60">Handle</label>
            <input
              value={handle}
              onChange={e => setHandle(e.target.value)}
              placeholder="e.g. @rhea.kapoor"
              className="mt-1 w-full py-2.5 px-3 bg-bone rounded-xl text-[13px] outline-none focus:ring-1 focus:ring-obsidian"
            />
          </div>

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
              <><Loader2 size={14} className="animate-spin" /> Saving to database…</>
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
