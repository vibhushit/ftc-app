import { useState } from 'react'
import { ChevronRight, Clock, Plus, Bell, Check, X, ShieldCheck, AlertCircle } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { inr } from '@/data/constants'
import { CRM_TABS, CRM_EMPTY } from '@/data/constants'
import { cn } from '@/utils'
import { apiClient } from '@/services/apiClient'

function getTimeRemaining(expiresAt?: string): string {
  if (!expiresAt) return '24h SLA active'
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m left to respond`
}

export function CreatorPipelineHome() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const tab = state.crmTab || 'pending_approval'
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const pendingRequests = state.creatorBookings.filter(b => b.status === 'pending_approval')
  const jobs = state.creatorBookings.filter(b => b.status === tab)
  const revenue = state.creatorBookings.filter(b => b.status === 'completed').reduce((a, b) => a + b.price, 0)
  const payout = state.creatorBookings
    .filter(b => b.status === 'pending' || b.status === 'upcoming' || b.status === 'pending_approval')
    .reduce((a, b) => a + (b.price - b.advancePaid), 0)

  const handleAccept = async (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation()
    setProcessingId(bookingId)
    try {
      await apiClient.acceptBooking(bookingId)
      dispatch({ type: 'UPDATE_CREATOR_BOOKING', id: bookingId, patch: { status: 'upcoming' } })
      setToastMessage('Booking accepted! Client advance secured in escrow.')
      setTimeout(() => setToastMessage(null), 4000)
    } catch (err: any) {
      setToastMessage('Failed to accept booking. Please try again.')
      setTimeout(() => setToastMessage(null), 4000)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation()
    setProcessingId(bookingId)
    try {
      await apiClient.declineBooking(bookingId, 'Creator unavailable')
      dispatch({ type: 'UPDATE_CREATOR_BOOKING', id: bookingId, patch: { status: 'declined' } })
      setToastMessage('Booking declined. Advance deposit automatically refunded to client.')
      setTimeout(() => setToastMessage(null), 4000)
    } catch (err: any) {
      setToastMessage('Failed to decline booking. Please try again.')
      setTimeout(() => setToastMessage(null), 4000)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-paper overflow-hidden relative">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-obsidian text-paper text-[12px] font-medium px-4 py-2.5 rounded-full shadow-lg border border-paper/10 flex items-center gap-2 animate-fade-in">
          <ShieldCheck size={14} className="text-acid shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="px-5 pt-4 pb-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-iris font-semibold">Creator pipeline</div>
            <div className="font-display text-3xl tracking-tight leading-none mt-1">Your jobs</div>
          </div>
          <button onClick={() => dispatch({ type: 'GO', screen: 'notifications' })} className="tap w-10 h-10 rounded-full bg-bone border border-line grid place-items-center relative">
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-iris" />
            <Bell size={18} className="text-obsidian/75" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            ['Revenue', inr(revenue), 'released'],
            ['Pending payout', inr(payout), 'in escrow'],
            ['Response rate', '98%', 'avg ~12 min'],
            ['Trust score', String((state.user?.trustScore) || 94), 'out of 100'],
          ].map((s, i) => (
            <div key={i} className="p-3 rounded-2xl bg-bone border border-line">
              <div className="font-display text-xl tracking-tight tnum leading-none">{s[1]}</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-obsidian/50 mt-1">{s[0]}</div>
              <div className="text-[10px] text-obsidian/40">{s[2]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-3 border-b border-line">
        {CRM_TABS.map(t => {
          const count = state.creatorBookings.filter(b => b.status === t.key).length
          const isSelected = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => dispatch({ type: 'SET_CRM_TAB', tab: t.key })}
              className={cn(
                'tap shrink-0 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition flex items-center gap-1.5',
                isSelected ? 'bg-obsidian text-paper' : 'bg-bone text-obsidian/60'
              )}
            >
              <span>{t.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold',
                    isSelected
                      ? 'bg-paper/20 text-paper'
                      : t.key === 'pending_approval'
                      ? 'bg-rose-500 text-white'
                      : 'bg-obsidian/10 text-obsidian/70'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="app-scroll pb-nav px-5 pt-3">
        {/* Urgent 24h Action Required Banner (shown regardless of tab if pending items exist) */}
        {tab !== 'pending_approval' && pendingRequests.length > 0 && (
          <div
            onClick={() => dispatch({ type: 'SET_CRM_TAB', tab: 'pending_approval' })}
            className="tap mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <div>
                <div className="text-[12px] font-bold text-amber-950">
                  {pendingRequests.length} Booking Request{pendingRequests.length > 1 ? 's' : ''} Awaiting Approval
                </div>
                <div className="text-[11px] text-amber-800">
                  Respond within 24 hours to secure client escrow deposit.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-iris">
              <span>View</span>
              <ChevronRight size={14} />
            </div>
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-bone border border-line grid place-items-center mb-4 shadow-xs">
              <Clock size={26} className="text-obsidian/40" />
            </div>
            <div className="font-display text-xl text-obsidian">{CRM_EMPTY[tab]?.[0] || 'No jobs yet'}</div>
            <p className="text-[13px] text-obsidian/55 mt-1 leading-relaxed">
              {CRM_EMPTY[tab]?.[1] || 'Inquiries and bookings from clients will appear here.'}
            </p>

            {/* Link-in-Bio Quick Share Card */}
            <div className="mt-6 p-4 rounded-2xl bg-obsidian text-paper w-full text-left relative overflow-hidden shadow-md">
              <div className="text-[10px] font-mono uppercase tracking-wider text-acid mb-1">Get Booked Faster</div>
              <div className="font-display text-base text-paper">Share your Link-in-Bio</div>
              <p className="text-[11.5px] text-paper/70 mt-0.5 leading-snug">
                Put your FTC link on Instagram to get direct client bookings with 0% commission.
              </p>
              <button
                onClick={() => dispatch({ type: 'GO', screen: 'linkbio' })}
                className="tap mt-3 w-full py-2.5 rounded-xl bg-acid text-obsidian font-semibold text-[12.5px] flex items-center justify-center gap-1.5 cursor-pointer hover:bg-acid/90 transition"
              >
                <span>Open Link-in-Bio Dashboard</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(b => {
              const isPending = b.status === 'pending_approval'
              return (
                <div
                  key={b.id}
                  onClick={() => dispatch({ type: 'OPEN_BOOKING', booking: b })}
                  className={cn(
                    'tap w-full p-4 rounded-2xl border text-left cursor-pointer transition-all',
                    isPending
                      ? 'bg-paper border-iris/40 shadow-xs'
                      : 'bg-paper border-line'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <img src={b.clientAvatar} className="w-12 h-12 rounded-xl object-cover shrink-0" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-[14px]">{b.clientName}</div>
                        <div className="font-mono text-[13px] font-bold text-obsidian">{inr(b.price)}</div>
                      </div>
                      <div className="text-[12px] text-obsidian/70 mt-0.5 font-medium">
                        {b.packageName || b.projectType}
                      </div>
                      <div className="text-[11px] font-mono text-obsidian/50 mt-0.5 flex items-center gap-1.5">
                        <Clock size={11} className="text-iris" />
                        <span>{b.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Client Notes & SLA Urgency for Pending Requests */}
                  {isPending && (
                    <div className="mt-3 pt-3 border-t border-line space-y-2.5">
                      {b.clientNotes && (
                        <div className="p-2.5 rounded-xl bg-bone border border-line text-[11.5px] text-obsidian/75 italic">
                          "{b.clientNotes}"
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-rose-600 font-semibold bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                          <AlertCircle size={12} className="text-rose-600" />
                          <span>{getTimeRemaining(b.requestExpiresAt)}</span>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                          {inr(b.advancePaid)} in Escrow
                        </div>
                      </div>

                      {/* Quick Accept / Decline Action Bar */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          disabled={processingId === b.id}
                          onClick={e => handleDecline(e, b.id)}
                          className="tap py-2 rounded-xl border border-line bg-bone hover:bg-obsidian/10 text-obsidian/80 text-[12px] font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                        >
                          <X size={14} className="text-obsidian/60" />
                          <span>Decline</span>
                        </button>
                        <button
                          disabled={processingId === b.id}
                          onClick={e => handleAccept(e, b.id)}
                          className="tap py-2 rounded-xl bg-obsidian text-paper hover:bg-obsidian/90 text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50"
                        >
                          <Check size={14} className="text-acid" />
                          <span>Accept Request</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => dispatch({ type: 'GO', screen: 'campaigns' })}
        className="absolute bottom-24 right-5 w-14 h-14 bg-obsidian text-paper rounded-2xl grid place-items-center shadow-lg tap"
      >
        <Plus size={22} />
      </button>
    </div>
  )
}

