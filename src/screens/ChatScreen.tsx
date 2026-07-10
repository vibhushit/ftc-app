import { useState } from 'react'
import { ArrowLeft, ArrowRight, FileText, Phone, Plus, X, Send } from 'lucide-react'
import { StatusBar } from '@/components/ui/StatusBar'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { CREATORS } from '@/data/creators'
import { inr, pic } from '@/data/constants'
import { cn } from '@/utils'

function depositInfo(price: number) {
  return price <= 10000
    ? { full: true, pct: 100, advance: price, balance: 0 }
    : { full: false, pct: 30, advance: Math.round(price * 0.3), balance: Math.round(price * 0.7) }
}

/* ─── QuoteCard ─── */
export function QuoteCard({ q, isCreator, dispatch }: { q: any; isCreator: boolean; dispatch: (a: any) => void }) {
  return (
    <div className="max-w-[85%] rounded-2xl border border-line bg-paper overflow-hidden mx-auto">
      <div className="px-3.5 py-2 bg-obsidian text-paper flex items-center gap-2">
        <FileText size={12} className="text-acid" />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em]">Custom quote</span>
        <span className={cn('ml-auto px-1.5 py-0.5 rounded text-[9px] font-mono uppercase',
          q.status === 'paid' ? 'bg-success text-paper' : q.status === 'declined' ? 'bg-danger text-paper' : 'bg-acid text-obsidian')}>
          {q.status === 'paid' ? 'Paid' : q.status === 'declined' ? 'Declined' : 'Sent'}
        </span>
      </div>
      <div className="p-3.5 space-y-1.5 text-[12.5px]">
        <div className="flex justify-between gap-3"><span className="text-obsidian/50">Scope</span><span className="font-semibold text-right">{q.scope}</span></div>
        <div className="flex justify-between"><span className="text-obsidian/50">Price</span><span className="font-display text-lg tnum">{inr(q.price)}</span></div>
        <div className="flex justify-between"><span className="text-obsidian/50">Est. delivery</span><span className="font-medium">{q.delivery}</span></div>
        {q.note && <div className="flex justify-between gap-3"><span className="text-obsidian/50 shrink-0">Note</span><span className="text-obsidian/70 text-right">{q.note}</span></div>}
      </div>
      {!isCreator && q.status === 'sent' && (
        <div className="px-3.5 pb-3.5 flex gap-2">
          <button
            onClick={() => { dispatch({ type: 'QUOTE_ACTION', id: q.id, status: 'paid' }); dispatch({ type: 'GO', screen: 'booking' }) }}
            className="tap flex-1 py-2.5 rounded-xl bg-obsidian text-paper font-semibold text-[12px]"
          >
            {depositInfo(q.price).full ? 'Pay & book' : `Pay ${depositInfo(q.price).pct}% deposit`}
          </button>
          <button onClick={() => dispatch({ type: 'QUOTE_ACTION', id: q.id, status: 'declined' })} className="tap px-4 py-2.5 rounded-xl bg-bone border border-line font-semibold text-[12px]">
            Decline
          </button>
        </div>
      )}
      {!isCreator && q.status === 'declined' && <div className="px-3.5 pb-3 text-[11px] text-danger font-medium">Quote declined</div>}
      {!isCreator && q.status === 'paid' && (
        <div className="px-3.5 pb-3 text-[11px] text-success font-medium flex items-center gap-1">
          ✓ Advance paid — booking confirmed
        </div>
      )}
      {isCreator && <div className="px-3.5 pb-3 text-[10px] text-obsidian/40 font-mono uppercase tracking-[0.1em]">Sent to client · awaiting response</div>}
    </div>
  )
}

/* ─── QuoteModal ─── */
function QuoteModal({ partnerName, onClose, onSend }: { partnerName: string; onClose: () => void; onSend: (d: any) => void }) {
  const [scope, setScope] = useState('Pre-wedding + Drone')
  const [price, setPrice] = useState('45000')
  const [delivery, setDelivery] = useState('May 7, 2026')
  const [note, setNote] = useState('Includes travel within city')
  const ok = scope.trim() && +price > 0 && delivery.trim()
  const dep = depositInfo(+price)

  return (
    <div className="absolute inset-0 z-40 flex items-end">
      <div className="absolute inset-0 bg-obsidian/40 backdrop-blur" onClick={onClose} />
      <div className="relative w-full bg-paper rounded-t-3xl shadow-2xl px-5 pt-4 pb-8 slide-up">
        <div className="w-10 h-1 rounded-full bg-obsidian/15 mx-auto mb-4" />
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-iris" />
          <div className="font-display text-xl tracking-tight">Quick quote</div>
          <button onClick={onClose} className="tap ml-auto w-8 h-8 grid place-items-center rounded-full bg-bone"><X size={15} /></button>
        </div>
        <div className="space-y-3.5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-1.5">Scope of work</div>
            <textarea value={scope} onChange={e => setScope(e.target.value)} rows={2} className="w-full p-3 rounded-xl bg-bone border border-line outline-none text-[13px] resize-none focus:border-iris" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-1.5">Price (₹)</div>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-3 rounded-xl bg-bone border border-line outline-none text-[13px] tnum focus:border-iris" />
            </div>
            <div className="flex-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-1.5">Est. delivery</div>
              <input value={delivery} onChange={e => setDelivery(e.target.value)} className="w-full p-3 rounded-xl bg-bone border border-line outline-none text-[13px] focus:border-iris" />
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-1.5">Add note (optional)</div>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="w-full p-3 rounded-xl bg-bone border border-line outline-none text-[13px] resize-none focus:border-iris" />
          </div>
        </div>
        <div className="mt-3 p-3 rounded-xl bg-iris-tint flex items-center justify-between text-[12px]">
          <span className="text-obsidian/60">{dep.full ? 'Client pays in full' : `Client pays now (${dep.pct}%)`}</span>
          <span className="font-display text-lg tnum text-iris">{inr(dep.advance)}</span>
        </div>
        <button
          disabled={!ok}
          onClick={() => onSend({ scope, price: +price, delivery, note })}
          className="tap w-full mt-4 py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-30"
        >
          <Send size={15} /> Send quote to {partnerName.split(' ')[0]}
        </button>
      </div>
    </div>
  )
}

/* ─── Chat Screen ─── */
export function ChatScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const [msg, setMsg] = useState('')
  const [showQuote, setShowQuote] = useState(false)
  const isCreator = state.isCreator

  const partner = (state.selectedClient as any) || CREATORS.find(x => x.id === state.selectedCreatorId) || { name: 'Chat', avatar: pic('chat', 80, 80), verification: undefined }
  const messages = isCreator ? [
    { from: 'them', text: 'Hi! Loved your portfolio. Can you do a pre-wedding shoot with drone in July?', t: '9:18 AM' },
    { from: 'me', text: 'Absolutely — let me put together a custom quote for you.', t: '9:21 AM' },
  ] : [
    { from: 'them', text: "Hey! Thanks for reaching out. I'd love to hear more about the project.", t: '2:14 PM' },
    { from: 'me', text: 'Looking for a pre-wedding shoot in Delhi next month. Outdoor.', t: '2:16 PM' },
    { from: 'them', text: 'Got it — sending you a custom quote now.', t: '2:18 PM' },
  ]

  const visibleQuotes = state.quotes.filter(q =>
    isCreator ? (q as any).creatorId === 'self' : ((partner as any).id && (q as any).creatorId === (partner as any).id)
  )

  const sendQuote = (data: any) => {
    dispatch({
      type: 'SEND_QUOTE',
      quote: { id: 'q' + Date.now(), scope: data.scope, price: data.price, delivery: data.delivery, note: data.note, status: 'sent' as const, createdAt: 'now', creatorId: 'self', clientId: partner.name } as any,
    })
    setShowQuote(false)
  }

  return (
    <div className="flex-1 flex flex-col bg-bone relative min-h-0">
      <StatusBar />
      {/* Header */}
      <div className="px-4 pt-2 pb-3 bg-paper border-b border-line flex items-center gap-3 shrink-0">
        <button onClick={() => dispatch({ type: 'BACK' })} className="tap -ml-1 p-1"><ArrowLeft size={20} /></button>
        <img src={partner.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold">{partner.name}</div>
          <div className="text-[11px] text-success">Active now</div>
        </div>
        <button className="tap w-9 h-9 rounded-full bg-bone grid place-items-center"><Phone size={14} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[78%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-snug', m.from === 'me' ? 'bg-obsidian text-paper rounded-br-md' : 'bg-paper text-obsidian border border-line rounded-bl-md')}>
              {m.text}
              <div className={cn('text-[10px] mt-1 font-mono', m.from === 'me' ? 'text-paper/50' : 'text-obsidian/40')}>{m.t}</div>
            </div>
          </div>
        ))}
        {visibleQuotes.map(q => (
          <div key={(q as any).id} className={cn('flex', isCreator ? 'justify-end' : 'justify-start')}>
            <QuoteCard q={q} isCreator={isCreator} dispatch={dispatch} />
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div className="bg-paper border-t border-line px-3 pt-2.5 pb-6 shrink-0">
        {isCreator && (
          <button onClick={() => setShowQuote(true)} className="tap w-full mb-2.5 py-3 rounded-xl bg-iris text-paper font-semibold text-[13px] flex items-center justify-center gap-2">
            <FileText size={15} /> Send Custom Quote
          </button>
        )}
        <div className="flex items-center gap-2">
          <button className="tap w-9 h-9 rounded-full bg-bone grid place-items-center shrink-0"><Plus size={16} /></button>
          <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Message" className="flex-1 py-2.5 px-4 bg-bone rounded-full text-[14px] outline-none" />
          <button onClick={() => setMsg('')} className="tap w-9 h-9 rounded-full bg-obsidian text-paper grid place-items-center shrink-0"><ArrowRight size={16} /></button>
        </div>
      </div>

      {showQuote && <QuoteModal partnerName={partner.name} onClose={() => setShowQuote(false)} onSend={sendQuote} />}
    </div>
  )
}
