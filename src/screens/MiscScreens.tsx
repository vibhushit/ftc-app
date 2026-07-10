import { useState } from 'react'
import {
  ArrowLeft, ArrowRight, Check, Shield, Users, Lock, FileText,
  Star, X, HelpCircle, BadgeCheck, Plus,
  Share2, Copy, CreditCard,
} from 'lucide-react'
import { StatusBar } from '@/components/ui/StatusBar'
import { SimpleHeader } from '@/components/ui/SimpleHeader'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { CREATORS } from '@/data/creators'
import { inr, pic } from '@/data/constants'
import { cn } from '@/utils'

/* ─── Agreement card reused by Legal ─── */
const AGREEMENTS_DATA: Record<string, { title: string; intro: string; points: string[] }> = {
  contract: { title: 'Standard Booking Contract', intro: 'By signing, you agree to:', points: ['Provide services exactly as described', 'Complete each booking within the agreed timeline', 'All bookings run on FTC Secure escrow'] },
  conduct:  { title: 'Safety & Conduct Policy', intro: 'Zero tolerance:', points: ['No harassment, discrimination or unsafe behaviour', 'ID-verified sessions only', 'Report any incident within 7 days via Safety Centre'] },
  tax:      { title: 'Tax Declaration', intro: 'By signing, you declare:', points: ['I am 18 or older and all details are true', '1% TDS (Section 194-O) deducted on payouts', 'GST collected and invoiced where applicable'] },
  cancel:   { title: 'Cancellation & Refund Policy', intro: 'By signing, you accept:', points: ['Free cancellation 48h+ before the booking', '50% charge for cancellations within 24h', 'Auto-refund if creator no-shows'] },
  escrow:   { title: 'Escrow & Payments Policy', intro: 'How money moves:', points: ['All payments held by FTC in escrow', 'Funds release after client approves delivery', 'Auto-release after 7 days if client does not respond'] },
  refund:   { title: 'Refund Policy', intro: 'Eligible for a refund when:', points: ['Creator cancels or no-shows — full refund', 'Work materially not as described — full or partial', 'Cancellation within free window — full deposit refund'] },
  dispute:  { title: 'Dispute Resolution Policy', intro: 'If something goes wrong:', points: ['Either side can raise a dispute within 7 days', 'Funds stay frozen in escrow while dispute is open', 'FTC reviews and decides within 7 days'] },
  travel:   { title: 'Travel Policy', intro: 'For bookings away from base:', points: ['Travel costs quoted up-front and shown in price breakdown', 'Estimates confirmed before balance is due', 'Cancellation within 7 days of outstation booking may forfeit travel costs'] },
  creator:  { title: 'Creator Agreement', intro: 'As a creator on FTC:', points: ['Be ID-verified and maintain accurate availability', 'Deliver services as described and on time', 'Communicate through FTC and use FTC escrow for all bookings'] },
  consumer: { title: 'Consumer Agreement', intro: 'As a client on FTC:', points: ['Provide accurate booking details', 'Pay through FTC escrow only', 'Treat creators respectfully; review honestly'] },
  privacy:  { title: 'Privacy Policy', intro: 'How we handle your data:', points: ['ID documents are encrypted', 'We never sell personal data', 'You can request export or deletion anytime'] },
  platform: { title: 'Platform Terms', intro: 'The basics of using FTC:', points: ['FTC is the trust & transaction layer', 'A platform fee applies to each booking', 'Accounts must be 18+ and may be suspended for violations'] },
}

function AgreementCard({ id, readonly }: { id: string; readonly?: boolean }) {
  const [open, setOpen] = useState(false)
  const a = AGREEMENTS_DATA[id]
  if (!a) return null
  return (
    <div className={cn('rounded-2xl border-2 overflow-hidden', readonly ? 'border-line bg-bone' : 'border-iris bg-iris-tint')}>
      <button onClick={() => setOpen(!open)} className="tap w-full flex items-center gap-2.5 px-4 py-3.5 text-left">
        <span>📋</span>
        <span className="flex-1 text-[13px] font-semibold">{a.title}</span>
        {readonly && <span className="flex items-center gap-1 text-[11px] text-success font-semibold"><Check size={12} /> Signed</span>}
        <div className={cn('w-5 h-5 text-obsidian/40 transition-transform', open ? 'rotate-180' : '')}>▾</div>
      </button>
      {open && (
        <div className="px-4 pb-3">
          <div className="text-[12px] text-obsidian/55 mb-2">{a.intro}</div>
          <div className="space-y-1.5">
            {a.points.map((p, i) => (
              <div key={i} className="flex gap-2 text-[12.5px] text-obsidian/75 leading-snug">
                <span className="text-iris">•</span> {p}
              </div>
            ))}
          </div>
        </div>
      )}
      {readonly && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-line/60 text-[11px] text-obsidian/50 font-mono">
          <Lock size={12} className="text-success" /> Signed · 12 Jun 2026
        </div>
      )}
    </div>
  )
}

/* ─── Safety Screen ─── */
export function SafetyScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone min-h-0">
      <SimpleHeader title="Safety Centre" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 pt-4 pb-8 space-y-3">
        <div className="p-5 rounded-2xl bg-paper border border-line text-center">
          <div className="w-14 h-14 rounded-2xl bg-success/10 grid place-items-center mx-auto mb-3">
            <Shield size={26} className="text-success" />
          </div>
          <div className="font-display text-lg leading-tight">You're protected</div>
          <div className="text-[12px] text-obsidian/60 mt-1.5 leading-relaxed">Every booking is ID-verified and covered by escrow. Sessions are insured up to ₹10L for incidents, damages & no-shows.</div>
        </div>
        <div className="bg-paper rounded-2xl border border-line overflow-hidden">
          {([
            [Shield,   'Verified both ways',          'Creators pass ID checks; clients verify phone + payment. No anonymous sessions.'],
            [Users,    'Public-place first meets',     'First-time bookings default to studios or public venues. Home visits unlock after a completed booking.'],
            [Lock,     'Escrow & insured sessions',    'Money never moves person-to-person. Sessions carry incident insurance up to ₹10L.'],
            [FileText, 'Dispute window',               'Either side can raise a dispute within 7 days of completion — FTC mediates and refunds where due.'],
          ] as [typeof Shield, string, string][]).map(([I, t, s], i, arr) => (
            <div key={i} className={cn('flex items-start gap-3 px-4 py-3.5', i < arr.length - 1 && 'border-b border-line')}>
              <div className="w-9 h-9 rounded-xl bg-bone grid place-items-center shrink-0">
                <I size={16} className="text-iris" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold">{t}</div>
                <div className="text-[11px] text-obsidian/60 mt-0.5 leading-relaxed">{s}</div>
              </div>
            </div>
          ))}
        </div>
        <button className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2">
          <HelpCircle size={16} /> Report an Issue / Dispute
        </button>
        <div className="text-center text-[11px] text-obsidian/40 font-mono">All reports are confidential · FTC Trust & Safety</div>
      </div>
    </div>
  )
}

/* ─── Legal Screen ─── */
export function LegalScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone min-h-0">
      <SimpleHeader title="Legal & contracts" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 pt-4 pb-8 space-y-2.5">
        <div className="p-3.5 rounded-2xl bg-iris-tint text-[12px] text-obsidian/70 leading-relaxed">
          Every booking on FTC runs on these standard policies — tap any to read the full terms. Your signed copies are stored here.
        </div>
        {['contract', 'creator', 'consumer', 'escrow', 'refund', 'cancel', 'dispute', 'travel', 'conduct', 'tax', 'privacy', 'platform'].map(id => (
          <AgreementCard key={id} id={id} readonly />
        ))}
      </div>
    </div>
  )
}

/* ─── Compare Screen ─── */
function fakeDistance(city: string) {
  const d: Record<string, number> = { Mumbai: 4, Delhi: 7, Bangalore: 3, Pune: 12, Hyderabad: 9, Chennai: 5, Jaipur: 15, Goa: 28 }
  return d[city] ?? 8
}

export function CompareScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const creators = state.compareIds.map(id => CREATORS.find(c => c.id === id)).filter(Boolean) as typeof CREATORS[0][]

  if (creators.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-paper min-h-0">
        <StatusBar />
        <div className="px-5 py-3 flex items-center border-b border-line">
          <button onClick={() => dispatch({ type: 'BACK' })} className="tap w-10 h-10 -ml-2 grid place-items-center"><ArrowLeft size={20} /></button>
          <span className="font-display text-lg tracking-tight ml-2">Compare</span>
        </div>
        <div className="flex-1 grid place-items-center text-center px-8">
          <div>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bone grid place-items-center"><Users size={28} className="text-obsidian/30" /></div>
            <h2 className="font-display text-xl">No creators yet</h2>
            <p className="text-[13px] text-obsidian/60 mt-1">Tap "+ Compare" on up to 3 creators to see them side-by-side.</p>
          </div>
        </div>
      </div>
    )
  }

  const rows: { label: string; val: (c: typeof CREATORS[0]) => React.ReactNode }[] = [
    { label: 'Starting price', val: c => <span className="font-display text-lg tnum">{inr(c.startingAt)}</span> },
    { label: 'Rating', val: c => <span className="flex items-center gap-0.5"><Star size={12} className="fill-obsidian text-obsidian" /><span className="font-semibold tnum">{c.rating}</span></span> },
    { label: 'Reviews', val: c => <span className="tnum">{c.reviews}</span> },
    { label: 'Experience', val: c => <span><span className="tnum">{c.yearsExp}</span>y · <span className="tnum">{c.completed}</span> jobs</span> },
    { label: 'Distance', val: c => <span className="tnum">{fakeDistance(c.city)} km</span> },
    { label: 'Response', val: c => <span>{c.responseTime}</span> },
    { label: 'Verification', val: c => <span className="text-[10px] uppercase font-mono">{c.verification}</span> },
    { label: 'Next slot', val: c => <span className="text-[11px]">{c.nextSlot}</span> },
    { label: 'Travels', val: c => <span className="capitalize">{c.travelRadius}</span> },
  ]
  const cols = `90px repeat(${creators.length}, 1fr)`

  return (
    <div className="flex-1 relative flex flex-col bg-paper overflow-hidden min-h-0">
      <StatusBar />
      <div className="px-5 py-3 flex items-center justify-between border-b border-line shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => dispatch({ type: 'BACK' })} className="tap w-10 h-10 -ml-2 grid place-items-center"><ArrowLeft size={20} /></button>
          <span className="font-display text-lg tracking-tight">Compare · {creators.length}</span>
        </div>
        <button onClick={() => dispatch({ type: 'CLEAR_COMPARE' })} className="text-[12px] font-medium text-iris">Clear</button>
      </div>
      {/* Sticky creator header */}
      <div className="grid border-b border-line shrink-0" style={{ gridTemplateColumns: cols }}>
        <div className="p-3" />
        {creators.map(c => (
          <div key={c.id} className="p-3 border-l border-line text-center relative">
            <button onClick={() => dispatch({ type: 'TOGGLE_COMPARE', id: c.id })} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-obsidian/5 grid place-items-center">
              <X size={11} />
            </button>
            <img src={c.avatar} className="w-10 h-10 rounded-full object-cover mx-auto mb-1.5" alt="" />
            <div className="font-display text-[12px] leading-tight">{c.name.split(' ')[0]}<br />{c.name.split(' ')[1]}</div>
          </div>
        ))}
      </div>
      <div className="app-scroll pb-28">
        {/* Portfolio row */}
        <div className="grid border-b border-line" style={{ gridTemplateColumns: cols }}>
          <div className="p-3 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">Work</div>
          {creators.map(c => (
            <div key={c.id} className="border-l border-line p-2">
              <div className="grid grid-cols-2 gap-1">
                {c.portfolio.slice(0, 3).map((p, i) => (
                  <div key={i} className={cn('aspect-square rounded bg-bone overflow-hidden', i === 0 && 'col-span-2 aspect-video')}>
                    <img src={p} className="w-full h-full object-cover" alt="" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {rows.map(row => (
          <div key={row.label} className="grid border-b border-line" style={{ gridTemplateColumns: cols }}>
            <div className="p-3 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">{row.label}</div>
            {creators.map(c => (
              <div key={c.id} className="p-3 border-l border-line text-[13px]">{row.val(c)}</div>
            ))}
          </div>
        ))}
        {/* Skills row */}
        <div className="grid border-b border-line" style={{ gridTemplateColumns: cols }}>
          <div className="p-3 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">Skills</div>
          {creators.map(c => (
            <div key={c.id} className="p-3 border-l border-line">
              <div className="flex flex-wrap gap-1">
                {c.subSkills.map(s => <span key={s} className="px-1.5 py-0.5 rounded text-[9px] bg-bone">{s}</span>)}
              </div>
            </div>
          ))}
        </div>
        <div className="p-5 text-[11px] text-obsidian/60 text-center">Compare is for you. Creators don't see who else you're considering.</div>
      </div>
      <div className="absolute bottom-0 inset-x-0 px-5 pb-6 pt-4 bg-paper/95 backdrop-blur-xl border-t border-line">
        <div className="flex gap-2">
          <button className="tap px-4 py-3.5 rounded-2xl bg-obsidian/5 font-semibold text-[13px]">Message all</button>
          <button onClick={() => dispatch({ type: 'OPEN_CREATOR', id: creators[0].id })} className="tap flex-1 py-3.5 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2">
            Book one <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Reviews Screen ─── */
const RECEIVED_REVIEWS = [
  { n: 'Karan Bhalla', t: 'Calm, creative and so quick with the edits. The whole shoot felt effortless and the photos are stunning.', r: 5, d: '1 week ago', cats: ['Quality', 'Communication'], photo: true },
  { n: 'Nisha Reddy', t: 'Captured my daughter\'s birthday beautifully. Worth every rupee — already booked again.', r: 5, d: '2 weeks ago', cats: ['Value', 'Timeliness'] },
  { n: 'Om Saxena', t: 'Professional corporate headshots, delivered ahead of schedule. Great communication throughout.', r: 4, d: '1 month ago', cats: ['Timeliness'] },
  { n: 'Sara Kapoor', t: 'Lovely engagement shoot. Made us feel super comfortable in front of the camera.', r: 5, d: '1 month ago', cats: ['Quality'] },
]

function StarRow({ value, size = 14, onSet }: { value: number; size?: number; onSet?: (v: number) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} onClick={onSet ? () => onSet(i) : undefined} className={onSet ? 'tap' : 'pointer-events-none'} style={{ lineHeight: 0 }}>
          <Star size={size} className={i <= Math.round(value) ? 'fill-obsidian text-obsidian' : 'text-obsidian/20'} />
        </button>
      ))}
    </div>
  )
}

const RATING_WORDS = ['Tap a star to rate', 'Poor', 'Fair', 'Good', 'Great', 'Amazing!']

export function ReviewsScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const isC = state.isCreator
  const [tab, setTab] = useState('received')
  const [rating, setRating] = useState(0)
  const baseCats = isC
    ? [['communication', 'Communication'], ['payment', 'Payment timeliness'], ['clarity', 'Clarity of brief']]
    : [['quality', 'Quality'], ['communication', 'Communication'], ['timeliness', 'Timeliness'], ['value', 'Value for money']]
  const [cats, setCats] = useState<Record<string, number>>(Object.fromEntries(baseCats.map(c => [c[0], 0])))
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [isPublic, setPublic] = useState(true)
  const target = isC ? 'Aisha Verma' : 'Ananya Desai'
  const prompts = isC
    ? ['Paid on time', 'Clear brief', 'Respectful', 'Would work again']
    : ['On time', 'Great communication', 'Exceeded expectations', 'Highly recommend', 'Great value']
  const addPrompt = (p: string) => setText(t => t.includes(p) ? t : (t ? t + (t.endsWith('.') || t.endsWith(' ') ? ' ' : '. ') + p : p))
  const submit = () => {
    if (!rating) return
    dispatch({ type: 'ADD_REVIEW', review: { id: 'r' + Date.now(), target, rating, categories: cats, text, isPublic, photos: photos.length, createdAt: 'Just now' } })
    setText(''); setRating(0); setPhotos([]); setTab('given')
  }
  const breakdown: [number, number][] = [[5, 76], [4, 18], [3, 4], [2, 1], [1, 1]]

  return (
    <div className="flex-1 flex flex-col bg-bone min-h-0">
      <SimpleHeader title="Reviews" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="flex gap-2 px-5 py-3 bg-paper border-b border-line shrink-0">
        {[['received', isC ? 'About you' : 'All reviews'], ['write', 'Write a review'], ['given', 'Given']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cn('chip', tab === k && 'chip-active')}>{l}</button>
        ))}
      </div>
      <div className="app-scroll px-5 py-4 pb-10">
        {/* Write tab */}
        {tab === 'write' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-paper border border-line p-6 text-center">
              <img src={pic(target + '-av', 120, 120)} className="w-14 h-14 rounded-full object-cover mx-auto mb-3" alt="" />
              <div className="text-[12px] text-obsidian/55 mb-1">{isC ? 'Rate your experience with' : 'How was your experience with'}</div>
              <div className="font-display text-2xl tracking-tight mb-4">{target}</div>
              <div className="flex justify-center gap-2">
                {[1,2,3,4,5].map(i => (
                  <button key={i} onClick={() => setRating(i)} className="tap" style={{ lineHeight: 0 }}>
                    <Star size={38} className={i <= rating ? 'fill-acid text-acid' : 'text-obsidian/15'} />
                  </button>
                ))}
              </div>
              <div className={cn('mt-3 text-[13px] font-semibold', rating ? 'text-iris' : 'text-obsidian/40')}>{RATING_WORDS[rating]}</div>
            </div>
            <div className="rounded-2xl bg-paper border border-line p-4 space-y-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">Rate the details</div>
              {baseCats.map(([k, l]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-[13px] text-obsidian/70">{l}</span>
                  <StarRow value={cats[k]} size={18} onSet={v => setCats(p => ({ ...p, [k]: v }))} />
                </div>
              ))}
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-2">Quick add</div>
              <div className="flex flex-wrap gap-2">
                {prompts.map(p => (
                  <button key={p} onClick={() => addPrompt(p)} className={cn('tap px-3 py-1.5 rounded-full text-[12px] font-medium border transition', text.includes(p) ? 'bg-iris text-paper border-iris' : 'bg-paper border-line text-obsidian/70')}>
                    + {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-1.5">Your review</div>
              <textarea value={text} maxLength={280} onChange={e => setText(e.target.value)} rows={4} placeholder="Tell others what made this experience special…" className="w-full p-3 rounded-xl bg-paper border border-line outline-none text-[13px] leading-relaxed resize-none focus:border-iris" />
              <div className="text-right text-[10px] text-obsidian/40 mt-1 font-mono">{text.length}/280</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-1.5">Add photos (optional)</div>
              <div className="flex gap-2 flex-wrap">
                {photos.map((p, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden bg-bone">
                    <img src={p} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="tap absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-obsidian/80 grid place-items-center">
                      <X size={10} className="text-paper" />
                    </button>
                  </div>
                ))}
                {photos.length < 4 && (
                  <button onClick={() => setPhotos([...photos, pic('rev-up' + Date.now(), 200, 200)])} className="tap w-16 h-16 rounded-xl border-2 border-dashed border-line grid place-items-center">
                    <Plus size={18} className="text-obsidian/40" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-paper border border-line">
              <div>
                <div className="text-[13px] font-semibold">{isPublic ? 'Public review' : 'Private feedback'}</div>
                <div className="text-[11px] text-obsidian/50">{isPublic ? 'Shown on their profile' : 'Only shared with them'}</div>
              </div>
              <button onClick={() => setPublic(!isPublic)} className={cn('tap relative w-11 h-6 rounded-full transition', isPublic ? 'bg-success' : 'bg-obsidian/15')}>
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-paper shadow-sm transition-all" style={{ left: isPublic ? 22 : 2 }} />
              </button>
            </div>
            <button onClick={submit} disabled={!rating} className={cn('tap w-full py-4 rounded-2xl font-semibold text-[14px]', rating ? 'bg-obsidian text-paper' : 'bg-bone text-obsidian/30')}>
              {rating ? 'Submit review' : 'Tap the stars to rate'}
            </button>
          </div>
        )}

        {/* Received tab */}
        {tab === 'received' && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-paper border border-line p-4">
              <div className="flex items-center gap-5">
                <div className="text-center shrink-0">
                  <div className="font-display text-4xl tnum leading-none">4.8</div>
                  <div className="flex justify-center mt-1"><StarRow value={5} size={12} /></div>
                  <div className="text-[11px] text-obsidian/45 mt-1">127 reviews</div>
                </div>
                <div className="flex-1 space-y-1">
                  {breakdown.map(([star, pct]) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-[10px] text-obsidian/40 w-2 tnum">{star}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-bone overflow-hidden">
                        <div className="h-full bg-acid rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-obsidian/40 w-7 text-right tnum">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-line grid grid-cols-2 gap-x-4 gap-y-2">
                {[['Quality', 4.9], ['Communication', 4.8], ['Timeliness', 4.7], ['Value', 4.8]].map(([l, v]) => (
                  <div key={l as string} className="flex items-center justify-between">
                    <span className="text-[11px] text-obsidian/60">{l}</span>
                    <span className="text-[12px] font-semibold tnum flex items-center gap-0.5">{v}<Star size={10} className="fill-obsidian text-obsidian" /></span>
                  </div>
                ))}
              </div>
            </div>
            {RECEIVED_REVIEWS.map((r, i) => (
              <div key={i} className="rounded-2xl bg-paper border border-line p-4">
                <div className="flex items-center gap-2.5">
                  <img src={pic(r.n + '-av', 80, 80)} className="w-9 h-9 rounded-full object-cover" alt="" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1"><span className="font-semibold text-[13px]">{r.n}</span><BadgeCheck size={12} className="text-iris" /></div>
                    <div className="text-[10px] font-mono text-obsidian/40">{r.d}</div>
                  </div>
                  <StarRow value={r.r} size={13} />
                </div>
                <p className="text-[12.5px] text-obsidian/75 mt-2 leading-relaxed">{r.t}</p>
                {r.cats && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.cats.map(c => <span key={c} className="px-2 py-0.5 rounded-full bg-bone text-[10px] text-obsidian/60">👍 {c}</span>)}
                  </div>
                )}
                {r.photo && <img src={pic('revphoto' + i, 300, 300)} className="mt-2 w-20 h-20 rounded-xl object-cover" alt="" />}
              </div>
            ))}
          </div>
        )}

        {/* Given tab */}
        {tab === 'given' && (
          state.reviews.length === 0
            ? (
              <div className="flex flex-col items-center text-center py-16">
                <div className="w-14 h-14 rounded-full bg-bone grid place-items-center mb-3"><Star size={24} className="text-obsidian/30" /></div>
                <div className="font-display text-lg">No reviews yet</div>
                <p className="text-[13px] text-obsidian/50 mt-1">Reviews you write will appear here.</p>
              </div>
            )
            : (
              <div className="space-y-3">
                {state.reviews.map(r => (
                  <div key={r.id} className="rounded-2xl bg-paper border border-line p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[13px]">To {r.target}</span>
                      <StarRow value={r.rating} size={13} />
                    </div>
                    {r.text && <p className="text-[12.5px] text-obsidian/70 mt-1.5 leading-relaxed">{r.text}</p>}
                    <div className="text-[10px] font-mono text-obsidian/40 mt-1.5">
                      {r.createdAt} · {r.isPublic ? 'Public' : 'Private'}{r.photos ? ` · ${r.photos} photo${r.photos > 1 ? 's' : ''}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )
        )}
      </div>
    </div>
  )
}

/* ─── Wallet Screen ─── */
export function WalletScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone min-h-0">
      <SimpleHeader title="Wallet" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 pt-4 pb-6 space-y-4">
        <div className="p-5 rounded-2xl bg-obsidian text-paper relative overflow-hidden">
          <div className="absolute inset-0 dots-acid opacity-10" />
          <div className="relative">
            <div className="text-[10px] font-mono uppercase tracking-wider text-acid">FTC Coins</div>
            <div className="mt-1 font-display text-4xl tnum">2,400</div>
            <div className="text-[11px] text-paper/60 mt-1">Worth ₹240 · use for boosts or discounts</div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-paper border border-line">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Payment methods</div>
            <button className="text-[11px] text-iris font-semibold">+ Add</button>
          </div>
          <div className="space-y-2">
            {[
              { label: 'UPI · @ananya-sbi', sub: 'Default for payouts' },
              { label: 'HDFC • 2847', sub: 'Expires 04/28' },
            ].map(p => (
              <div key={p.label} className="flex items-center gap-3 p-3 rounded-xl bg-bone">
                <div className="w-9 h-9 rounded-lg bg-paper grid place-items-center"><CreditCard size={16} className="text-obsidian/60" /></div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium">{p.label}</div>
                  <div className="text-[10px] text-obsidian/50">{p.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-paper border border-line">
          <div className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50 mb-3">Recent activity</div>
          <div className="space-y-3">
            {[
              { label: 'Referral: RIYA300', amt: '+₹1,000', time: 'Apr 18', positive: true },
              { label: 'Booking #FTC8201 · Kabir S.', amt: '-₹15,000', time: 'Apr 12' },
              { label: 'Cashback', amt: '+40 coins', time: 'Apr 09', positive: true },
            ].map((a, i) => (
              <div key={i} className="flex items-center justify-between text-[13px]">
                <div>
                  <div className="font-medium">{a.label}</div>
                  <div className="text-[10px] text-obsidian/50">{a.time}</div>
                </div>
                <div className={cn('font-mono text-[13px]', a.positive ? 'text-success' : 'text-obsidian')}>{a.amt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Referral Screen ─── */
export function ReferralScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const name = state.user?.name ?? 'GUEST'
  return (
    <div className="flex-1 flex flex-col bg-acid relative overflow-hidden min-h-0">
      <div className="absolute inset-0 dots-obsidian opacity-[0.08] pointer-events-none" />
      <StatusBar />
      <div className="relative px-5 pt-2 pb-3 flex items-center justify-between">
        <button onClick={() => dispatch({ type: 'BACK' })} className="tap -ml-2 p-2"><ArrowLeft size={20} /></button>
        <div className="font-mono text-[11px] uppercase tracking-wider text-obsidian/60">Refer & earn</div>
        <div className="w-8" />
      </div>
      <div className="app-scroll px-5 pb-10">
        <div className="mt-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-iris font-semibold">Pay it forward</div>
          <h1 className="mt-2 font-display text-5xl tracking-tighter leading-[0.9]">Give ₹500.<br /><span className="italic">Get ₹1,000.</span></h1>
          <p className="mt-4 text-[14px] text-obsidian/70 leading-relaxed">When a creator joins FTC with your code and completes their first booking, you get ₹1,000 paid directly to your UPI. They get ₹500 off their Pro subscription.</p>
        </div>
        <div className="mt-6 p-4 rounded-2xl bg-obsidian text-paper">
          <div className="text-[10px] font-mono uppercase tracking-wider text-acid">Your code</div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="font-display text-3xl tracking-wider">{name.slice(0, 4).toUpperCase()}500</div>
            <button className="tap shrink-0 px-4 py-2 rounded-xl bg-acid text-obsidian text-[12px] font-semibold">Copy</button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="tap py-3 rounded-2xl bg-obsidian text-paper font-semibold text-[13px] flex items-center justify-center gap-1.5">
            <Share2 size={14} /> WhatsApp
          </button>
          <button className="tap py-3 rounded-2xl bg-paper text-obsidian font-semibold text-[13px] flex items-center justify-center gap-1.5 border border-obsidian/10">
            <Copy size={14} /> Copy link
          </button>
        </div>
        <div className="mt-8">
          <div className="font-mono text-[10px] uppercase tracking-wider text-obsidian/50 mb-3">Your impact</div>
          <div className="grid grid-cols-3 gap-2">
            {[['3', 'Joined'], ['1', 'Booked'], ['₹1K', 'Earned']].map(([v, l]) => (
              <div key={l} className="p-3 rounded-xl bg-paper">
                <div className="font-display text-2xl tnum">{v}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-obsidian/60 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 text-[11px] text-obsidian/60 leading-relaxed">Referrals pay out via UPI within 7 days of the referred creator's first completed booking. Both parties must be KYC-verified.</div>
      </div>
    </div>
  )
}

/* ─── OnboardKyc (trust score detail) ─── */
export function OnboardKycScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone min-h-0">
      <SimpleHeader title="Trust Score" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 py-4 pb-8 space-y-4">
        <div className="p-5 rounded-2xl bg-obsidian text-paper relative overflow-hidden">
          <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
          <div className="relative">
            <div className="text-[10px] font-mono uppercase tracking-wider text-acid">Your trust score</div>
            <div className="font-display text-5xl tnum mt-1 text-paper">92<span className="text-xl text-paper/40">/100</span></div>
            <div className="mt-3 h-2 rounded-full bg-paper/15 overflow-hidden">
              <div className="h-full bg-acid" style={{ width: '92%' }} />
            </div>
          </div>
        </div>
        {[
          ['Government ID · Aadhaar', 40, true],
          ['Face match · selfie', 20, true],
          ['Phone verification', 10, true],
          ['Email verification', 5, true],
          ['Performance (completion, response, repeat)', 17, true],
        ].map(([lab, pts, done], i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-paper border border-line text-[13px]">
            <span className="flex items-center gap-2">
              <div className={cn('w-4 h-4 rounded-full grid place-items-center', done ? 'bg-success' : 'bg-bone border border-line')}>
                {done && <Check size={10} className="text-paper" strokeWidth={3} />}
              </div>
              {lab as string}
            </span>
            <span className={cn('font-semibold tnum', done ? 'text-success' : 'text-obsidian/35')}>+{pts as number}</span>
          </div>
        ))}
        <div className="p-3.5 rounded-2xl bg-iris-tint text-[12px] text-obsidian/70 leading-relaxed">
          Your trust score grows with every completed booking. Creators with 90+ get priority placement in search results.
        </div>
      </div>
    </div>
  )
}
