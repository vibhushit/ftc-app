import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, ArrowRight, FileText, Phone, Plus, X, Send, CheckCheck, Clock } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { CREATORS } from '@/data/creators'
import { inr, pic } from '@/data/constants'
import { cn } from '@/utils'
import { InboxList } from './StubScreens'

function depositInfo(price: number) {
  return price <= 10000
    ? { full: true, pct: 100, advance: price, balance: 0 }
    : { full: false, pct: 30, advance: Math.round(price * 0.3), balance: Math.round(price * 0.7) }
}

/* ─── QuoteCard ─── */
export function QuoteCard({ q, isCreator, dispatch }: { q: any; isCreator: boolean; dispatch: (a: any) => void }) {
  const isMine = isCreator ? q.creatorId === 'self' : q.clientId === 'self'

  return (
    <div className={cn(
      'w-full max-w-[85%] sm:max-w-[360px] rounded-2xl border border-line bg-paper overflow-hidden shadow-sm my-1',
      isMine ? 'ml-auto' : 'mr-auto'
    )}>
      <div className="px-4 py-2.5 bg-obsidian text-paper flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <FileText size={13} className="text-acid" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em]">Custom Quote</span>
        </div>
        <span className={cn('px-2 py-0.5 rounded-full text-[9.5px] font-mono uppercase font-semibold',
          q.status === 'paid' ? 'bg-success text-paper' : q.status === 'declined' ? 'bg-danger text-paper' : 'bg-acid text-obsidian')}>
          {q.status === 'paid' ? 'Paid & Booked' : q.status === 'declined' ? 'Declined' : 'Pending Response'}
        </span>
      </div>
      <div className="p-4 space-y-2 text-[12.5px]">
        <div className="flex justify-between gap-3 pb-1 border-b border-line/50">
          <span className="text-obsidian/55">Scope of Work</span>
          <span className="font-semibold text-right text-obsidian">{q.scope}</span>
        </div>
        <div className="flex justify-between items-center py-0.5">
          <span className="text-obsidian/55">Total Price</span>
          <span className="font-display text-xl tnum font-semibold text-obsidian">{inr(q.price)}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-obsidian/55">Est. Delivery</span>
          <span className="font-medium text-obsidian">{q.delivery}</span>
        </div>
        {q.note && (
          <div className="flex justify-between gap-3 pt-1 border-t border-line/50">
            <span className="text-obsidian/55 shrink-0">Note</span>
            <span className="text-obsidian/75 text-right text-[11.5px]">{q.note}</span>
          </div>
        )}
      </div>

      {!isCreator && q.status === 'sent' && (
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={() => { dispatch({ type: 'QUOTE_ACTION', id: q.id, status: 'paid' }); dispatch({ type: 'GO', screen: 'booking' }) }}
            className="tap flex-1 py-3 rounded-xl bg-obsidian text-paper font-semibold text-[12px] shadow-sm hover:bg-obsidian/90 transition"
          >
            {depositInfo(q.price).full ? 'Pay & Book Now' : `Pay ${depositInfo(q.price).pct}% Deposit`}
          </button>
          <button
            onClick={() => dispatch({ type: 'QUOTE_ACTION', id: q.id, status: 'declined' })}
            className="tap px-4 py-3 rounded-xl bg-bone border border-line font-semibold text-[12px] hover:bg-obsidian/5 transition"
          >
            Decline
          </button>
        </div>
      )}
      {!isCreator && q.status === 'declined' && <div className="px-4 pb-3 text-[11.5px] text-danger font-medium">Quote declined</div>}
      {!isCreator && q.status === 'paid' && (
        <div className="px-4 pb-3 text-[11.5px] text-success font-medium flex items-center gap-1.5">
          <CheckCheck size={14} /> Deposit paid — booking confirmed
        </div>
      )}
      {isCreator && (
        <div className="px-4 pb-3 text-[10.5px] text-obsidian/45 font-mono uppercase tracking-[0.1em] flex items-center gap-1">
          <Clock size={11} /> Sent to client · awaiting response
        </div>
      )}
    </div>
  )
}

/* ─── QuoteModal ─── */
function QuoteModal({ partnerName, onClose, onSend }: { partnerName: string; onClose: () => void; onSend: (d: any) => void }) {
  const [scope, setScope] = useState('Pre-wedding + Drone shoot')
  const [price, setPrice] = useState('45000')
  const [delivery, setDelivery] = useState('May 7, 2026')
  const [note, setNote] = useState('Includes travel within city')
  const ok = scope.trim() && +price > 0 && delivery.trim()
  const dep = depositInfo(+price)

  return (
    <div className="absolute inset-0 z-40 flex items-end">
      <div className="absolute inset-0 bg-obsidian/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full bg-paper rounded-t-3xl shadow-2xl px-5 pt-4 pb-8 slide-up max-w-lg mx-auto">
        <div className="w-10 h-1 rounded-full bg-obsidian/15 mx-auto mb-4" />
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-iris" />
          <div className="font-display text-xl tracking-tight">Create Custom Quote</div>
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
        <div className="mt-4 p-3.5 rounded-xl bg-iris-tint flex items-center justify-between text-[12.5px]">
          <span className="text-obsidian/60">{dep.full ? 'Client pays in full' : `Client pays advance (${dep.pct}%)`}</span>
          <span className="font-display text-lg tnum text-iris font-semibold">{inr(dep.advance)}</span>
        </div>
        <button
          disabled={!ok}
          onClick={() => onSend({ scope, price: +price, delivery, note })}
          className="tap w-full mt-4 py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-30 shadow-md"
        >
          <Send size={15} /> Send quote to {partnerName ? partnerName.split(' ')[0] : 'client'}
        </button>
      </div>
    </div>
  )
}

export function ChatScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const [msgInput, setMsgInput] = useState('')
  const [showQuote, setShowQuote] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isCreator = state.isCreator

  const partner = (state.selectedClient as any) || CREATORS.find(x => x.id === state.selectedCreatorId) || { name: 'Chat', avatar: pic('chat', 80, 80), verification: undefined }
  
  const [messages, setMessages] = useState([
    ...(isCreator ? [
      { id: '1', from: 'them', text: 'Hi! Loved your portfolio. Can you do a pre-wedding shoot with drone in July?', t: '9:18 AM' },
      { id: '2', from: 'me', text: 'Absolutely — let me put together a custom quote for you.', t: '9:21 AM' },
    ] : [
      { id: '1', from: 'them', text: "Hey! Thanks for reaching out. I'd love to hear more about the project.", t: '2:14 PM' },
      { id: '2', from: 'me', text: 'Looking for a pre-wedding shoot in Delhi next month. Outdoor.', t: '2:16 PM' },
      { id: '3', from: 'them', text: 'Got it — sending you a custom quote now.', t: '2:18 PM' },
    ])
  ])

  const visibleQuotes = state.quotes.filter(q =>
    isCreator ? (q as any).creatorId === 'self' : ((partner as any).id && (q as any).creatorId === (partner as any).id)
  )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, visibleQuotes.length])

  const handleSendMsg = () => {
    if (!msgInput.trim()) return
    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { id: 'm_' + Date.now(), from: 'me', text: msgInput.trim(), t: timeStr }])
    setMsgInput('')
  }

  const sendQuote = (data: any) => {
    dispatch({
      type: 'SEND_QUOTE',
      quote: { id: 'q' + Date.now(), scope: data.scope, price: data.price, delivery: data.delivery, note: data.note, status: 'sent' as const, createdAt: 'now', creatorId: 'self', clientId: partner.name } as any,
    })
    setShowQuote(false)
  }

  const chatPane = (
    <div className="flex-1 flex flex-col bg-bone relative min-h-0 h-full">
      {/* Header */}
      <div className="px-4 py-3 bg-paper border-b border-line flex items-center gap-3 shrink-0 shadow-xs">
        <button onClick={() => dispatch({ type: 'BACK' })} className="tap -ml-1 p-1"><ArrowLeft size={20} /></button>
        <img src={partner.avatar} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
        <div className="flex-1 min-w-0">
          <div className="text-[14.5px] font-semibold text-obsidian truncate">{partner.name}</div>
          <div className="text-[11px] text-success font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" /> Active now
          </div>
        </div>
        <button className="tap w-9 h-9 rounded-full bg-bone border border-line grid place-items-center"><Phone size={15} /></button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.map(m => (
          <div key={m.id} className={cn('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed shadow-xs', m.from === 'me' ? 'bg-obsidian text-paper rounded-br-xs' : 'bg-paper text-obsidian border border-line rounded-bl-xs')}>
              {m.text}
              <div className={cn('text-[9.5px] mt-1 font-mono text-right', m.from === 'me' ? 'text-paper/50' : 'text-obsidian/40')}>{m.t}</div>
            </div>
          </div>
        ))}

        {/* Custom Quotes Stream */}
        {visibleQuotes.map(q => (
          <div key={(q as any).id} className="w-full flex justify-end">
            <QuoteCard q={q} isCreator={isCreator} dispatch={dispatch} />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="bg-paper border-t border-line px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] shrink-0 shadow-md">
        {isCreator && (
          <button onClick={() => setShowQuote(true)} className="tap w-full mb-3 py-3 rounded-xl bg-iris text-paper font-semibold text-[13px] flex items-center justify-center gap-2 shadow hover:bg-iris/90 transition cursor-pointer">
            <FileText size={16} /> Send Custom Quote
          </button>
        )}
        <div className="flex items-center gap-2">
          <button className="tap w-10 h-10 rounded-full bg-bone border border-line grid place-items-center shrink-0 hover:bg-obsidian/5 cursor-pointer"><Plus size={18} /></button>
          <input
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMsg()}
            placeholder="Type a message..."
            className="flex-1 py-2.5 px-4 bg-bone rounded-full text-[16px] md:text-[14px] outline-none border border-line focus:border-obsidian/40"
          />
          <button
            onClick={handleSendMsg}
            disabled={!msgInput.trim()}
            className="tap w-10 h-10 rounded-full bg-obsidian text-paper grid place-items-center shrink-0 disabled:opacity-30 hover:bg-obsidian/90 transition shadow-sm"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {showQuote && <QuoteModal partnerName={partner.name} onClose={() => setShowQuote(false)} onSend={sendQuote} />}
    </div>
  )

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-paper overflow-hidden h-full">
      <div className="hidden md:flex flex-none md:w-[320px] lg:w-[360px] md:border-r md:border-line h-full flex-col">
        <InboxList />
      </div>
      <div className="flex-1 flex flex-col h-full min-w-0">
        {chatPane}
      </div>
    </div>
  )
}
