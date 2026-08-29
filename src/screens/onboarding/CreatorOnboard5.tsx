import { useState } from 'react'
import { Instagram, Film, Globe, Briefcase, Link2, AtSign, Check, ChevronDown } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/utils'
import { useUpsertCreatorProfile } from '@/hooks/useCreators'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'
import { apiClient } from '@/services/apiClient'
import { isLiveMode } from '@/config/environmentMode'
import { OnboardShell } from './OnboardShell'

export function CreatorOnboard5() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const upsert = useUpsertCreatorProfile()
  const [soc, setSoc] = useState({ ig: '', yt: '', be: '', li: '', web: '' })
  const [upi, setUpi] = useState('')
  const [consents, setConsents] = useState<Record<string, boolean>>({ contract: false, conduct: false, tax: false, cancel: false })
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const allConsent = consents.contract && consents.conduct && consents.tax && consents.cancel

  const UPI_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/
  const isValidUpi = UPI_REGEX.test(upi.trim())
  const isValidIg = soc.ig.trim().length >= 2

  const submit = async () => {
    setSubmitting(true)
    const ob = state.onboard
    try {
      await apiClient.onboardCreator({
        name: ob.name || 'Creator',
        bio: ob.bio || '',
        discipline: ob.discipline || 'Photography',
        sub_skills: ob.subSkills || [],
        years_exp: ob.yearsExp || 2,
        upi_id: upi,
        instagram_handle: soc.ig,
        portfolio_urls: ob.portfolio ?? [],
      })

      if (supabaseAvailable && state.supabaseUserId && isLiveMode()) {
        const handle = `@${ob.name.replace(/\s+/g, '.').toLowerCase()}`
        await authApi.updateMyProfile({ name: ob.name, city: ob.city })
        await upsert.mutateAsync({
          id:           state.supabaseUserId,
          handle,
          bio:          ob.bio,
          tagline:      '',
          discipline:   ob.discipline,
          sub_skills:   ob.subSkills,
          years_exp:    ob.yearsExp,
          starting_at:  ob.startingPrice,
          city:         ob.city,
          area:         ob.area ?? '',
          languages:    (ob.languages as string[]) ?? ['Hindi', 'English'],
          travel_mode:  ob.travelMode ?? 'both',
          ig_handle:    soc.ig  || null,
          yt_handle:    soc.yt  || null,
          website_url:  soc.web || null,
          upi_id:       upi,
          onboard_step: 'review',
          is_published: false,
        })
      }
    } catch (e) {
      console.error('[FTC] onboard submit failed:', e)
    } finally {
      setSubmitting(false)
      dispatch({ type: 'GO', screen: 'creatorOnboardReview' })
    }
  }
  type SocKey = keyof typeof soc
  type ConKey = keyof typeof consents

  const SOCIALS: { k: SocKey; icon: typeof Instagram; label: string; ph: string; req: boolean }[] = [
    { k: 'ig',  icon: Instagram, label: 'Instagram',       ph: '@yourhandle',       req: true },
    { k: 'yt',  icon: Film,      label: 'YouTube',         ph: 'youtube.com/@channel', req: false },
    { k: 'be',  icon: Globe,     label: 'Behance / Dribbble', ph: 'behance.net/you', req: false },
    { k: 'li',  icon: Briefcase, label: 'LinkedIn',        ph: 'linkedin.com/in/you', req: false },
    { k: 'web', icon: Link2,     label: 'Website',         ph: 'yoursite.com',      req: false },
  ]

  const AGREEMENTS: { k: ConKey; title: string; points: string[] }[] = [
    { k: 'contract', title: 'Standard Booking Contract', points: ['Provide services exactly as described', 'Complete within agreed timeline', 'All bookings run on FTC Secure escrow'] },
    { k: 'conduct',  title: 'Safety & Conduct Policy',   points: ['No harassment or unsafe behaviour', 'ID-verified sessions only', 'Report incidents within 7 days'] },
    { k: 'tax',      title: 'Tax Declaration',            points: ['I am 18 or older and all details are true', '1% TDS deducted on payouts against PAN', 'GST invoiced where applicable'] },
    { k: 'cancel',   title: 'Cancellation & Refund Policy', points: ['Free cancellation 48h+ before session', '50% charge within 24h', 'Auto-refund if creator no-shows'] },
  ]

  return (
    <OnboardShell
      step={5} total={5}
      title="Socials & paperwork"
      sub="Link every platform you're active on. Then sign four quick agreements that protect both sides."
      onBack={() => dispatch({ type: 'GO', screen: 'creatorOnboard4' })}
      cta={submitting || upsert.isPending ? 'Submitting…' : 'Submit for review'}
      ctaDisabled={!isValidIg || !isValidUpi || !allConsent || submitting || upsert.isPending}
      ctaAction={submit}
    >
      <div className="space-y-5">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50 mb-2">Your platforms</div>
          <div className="space-y-2">
            {SOCIALS.map(s => {
              const filled = soc[s.k].trim().length > 0
              return (
                <div key={s.k} className={cn('rounded-2xl border-2 transition p-3', filled ? 'border-iris bg-iris-tint' : 'border-line bg-bone')}>
                  <div className="flex items-center gap-2.5">
                    <div className={cn('w-9 h-9 rounded-xl grid place-items-center shrink-0 transition', filled ? 'bg-iris text-paper' : 'bg-paper text-obsidian/60')}>
                      <s.icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold">{s.label}</span>
                        {s.req
                          ? <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold bg-acid text-obsidian">REQUIRED</span>
                          : <span className="text-[9px] font-mono text-obsidian/40">optional</span>
                        }
                        {filled && <Check size={12} className="text-success" />}
                      </div>
                      <input
                        value={soc[s.k]}
                        onChange={e => setSoc({ ...soc, [s.k]: e.target.value })}
                        placeholder={s.ph}
                        className="w-full bg-transparent text-[13px] outline-none mt-0.5"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50 mb-2">Payouts & safety</div>
          <div className={cn('rounded-2xl border-2 transition p-3', isValidUpi ? 'border-iris bg-iris-tint' : upi.length > 0 ? 'border-danger bg-danger/10' : 'border-line bg-bone')}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-paper grid place-items-center shrink-0"><AtSign size={16} className="text-obsidian/60" /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold">UPI for payouts</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold bg-acid text-obsidian">REQUIRED</span>
                  {upi.length > 0 && !isValidUpi && <span className="text-[10px] text-danger font-medium">Format: name@upi</span>}
                </div>
                <input value={upi} onChange={e => setUpi(e.target.value)} placeholder="name@upi" className="w-full bg-transparent text-[13px] outline-none mt-0.5" />
              </div>
            </div>
            <div className="mt-1.5 text-[10px] text-obsidian/50">Escrow releases land here within 24h of client approval.</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-obsidian relative overflow-hidden">
          <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
          <div className="relative text-[10px] font-mono uppercase tracking-wider text-acid">Your booking link</div>
          <div className="relative font-display text-xl text-paper mt-1">ftc.app/{soc.ig.trim() || '@yourhandle'}</div>
          <div className="relative mt-2 text-[11px] text-paper/60 leading-relaxed">Put this in your Instagram bio. Fans tap it, land on your verified FTC profile, and book with escrow — no DM negotiations.</div>
        </div>

        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50 mb-2">Agreements · tap to read, then sign</div>
          <div className="space-y-2">
            {AGREEMENTS.map(a => (
              <div key={a.k} className={cn('rounded-2xl border-2 overflow-hidden transition', consents[a.k] ? 'border-iris bg-iris-tint' : 'border-line bg-bone')}>
                <button onClick={() => setOpenAccordions(o => ({ ...o, [a.k]: !o[a.k] }))} className="tap w-full flex items-center gap-2.5 px-4 py-3.5 text-left">
                  <span>📋</span>
                  <span className="flex-1 text-[13px] font-semibold">{a.title}</span>
                  {consents[a.k] && <span className="flex items-center gap-1 text-[11px] text-success font-semibold"><Check size={12} /> Agreed</span>}
                  <ChevronDown size={16} className={cn('text-obsidian/40 transition-transform', openAccordions[a.k] && 'rotate-180')} />
                </button>
                {openAccordions[a.k] && (
                  <div className="px-4 pb-2">
                    <div className="space-y-1.5 mb-3">
                      {a.points.map((p, i) => (
                        <div key={i} className="flex gap-2 text-[12.5px] text-obsidian/75 leading-snug">
                          <span className="text-iris">•</span> {p}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={() => setConsents(c => ({ ...c, [a.k]: !c[a.k] }))} className="tap w-full flex items-center gap-2.5 px-4 py-3 border-t border-line/60 text-left">
                  <div className={cn('w-5 h-5 rounded-md grid place-items-center shrink-0 border-2', consents[a.k] ? 'bg-iris border-iris' : 'border-obsidian/30')}>
                    {consents[a.k] && <Check size={12} className="text-paper" strokeWidth={3} />}
                  </div>
                  <span className="text-[12.5px] font-medium">I agree to the {a.title}</span>
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 p-3 rounded-xl bg-bone border border-line text-[11px] text-obsidian/60 leading-relaxed">
            Signed copies live in Me → Legal & contracts. We'll also email them to you.
          </div>
        </div>
      </div>
    </OnboardShell>
  )
}
