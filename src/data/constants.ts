import type { Campaign, Deal, Booking, Quote } from '@/types'

export const CITIES: Record<string, string[]> = {
  Mumbai: ['Bandra', 'Andheri', 'Juhu', 'Powai', 'Colaba', 'Worli'],
  Delhi: ['Hauz Khas', 'Saket', 'Defence Colony', 'GK II', 'Lajpat Nagar'],
  Bangalore: ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Jayanagar'],
  Pune: ['Kothrud', 'Koregaon Park', 'Baner', 'Viman Nagar'],
  Hyderabad: ['Jubilee Hills', 'Banjara Hills', 'Gachibowli', 'Hi-Tech City'],
  Chennai: ['Nungambakkam', 'Adyar', 'T. Nagar', 'Velachery'],
  Jaipur: ['C-Scheme', 'Malviya Nagar', 'Vaishali Nagar'],
  Goa: ['Assagao', 'Vagator', 'Panjim', 'Morjim'],
  Kolkata: ['Park Street', 'Salt Lake', 'Ballygunge'],
  Chandigarh: ['Sector 17', 'Sector 35', 'Sector 9'],
  Ahmedabad: ['Navrangpura', 'Vastrapur', 'SG Highway'],
  Kochi: ['Kakkanad', 'Fort Kochi', 'Panampilly Nagar'],
  Indore: ['Vijay Nagar', 'Palasia', 'AB Road'],
}

export const AREA_COORDS: Record<string, [number, number]> = {
  'Hauz Khas': [28.5494, 77.2001],
  'Green Park': [28.5587, 77.2065],
  Saket: [28.5245, 77.2066],
  'Defence Colony': [28.5733, 77.231],
  'GK II': [28.5285, 77.241],
  'Lajpat Nagar': [28.5677, 77.2433],
  'Punjabi Bagh': [28.668, 77.13],
  'Rajouri Garden': [28.642, 77.121],
  Janakpuri: [28.6219, 77.0814],
  'Connaught Place': [28.6315, 77.2167],
  'Karol Bagh': [28.6517, 77.19],
  'Laxmi Nagar': [28.636, 77.277],
  'Preet Vihar': [28.641, 77.295],
  'Civil Lines': [28.679, 77.225],
  'Model Town': [28.716, 77.192],
}

export const ALL_LANGUAGES = [
  'Hindi', 'English', 'Punjabi', 'Marathi', 'Tamil',
  'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Urdu',
]

export const TRAVEL_MODES = {
  studio: { label: 'At their studio', short: 'Studio only', sub: "You visit the creator's own space" },
  travel: { label: 'Comes to you', short: 'Travels to you', sub: 'Creator travels to your location' },
  both: { label: 'Studio or your place', short: 'Studio or travel', sub: "Their place or yours \u2014 your choice" },
}

export const DEAL_STAGES = [
  { key: 'applied', label: 'Applied' },
  { key: 'contract', label: 'Contract' },
  { key: 'active', label: 'In progress' },
  { key: 'completed', label: 'Paid' },
] as const

export const CRM_TABS = [
  { key: 'inquiry', label: 'Inquiries' },
  { key: 'upcoming', label: 'Advance Paid' },
  { key: 'pending', label: 'Pending Delivery' },
  { key: 'completed', label: 'Completed' },
]

export const CRM_EMPTY: Record<string, [string, string]> = {
  inquiry: ['New leads land here', "When a client messages or requests a quote, you'll see them in this column."],
  upcoming: ['No upcoming sessions', 'Bookings with a deposit paid show here with their date & time.'],
  pending: ['Nothing in delivery', 'Active jobs awaiting final delivery appear here.'],
  completed: ['No completed jobs yet', 'Finished jobs with full payment released are archived here.'],
}

export const pic = (seed: string, w = 800, h = 800) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`

export const inr = (n: number) =>
  `₹${n.toLocaleString('en-IN')}`

export const CAMPAIGNS: Campaign[] = [
  {
    id: 'cp1', kind: 'brand',
    posterName: 'Phool.co', posterAvatar: pic('phool', 200, 200),
    posterHandle: '@phool', posterVerified: true,
    title: 'Looking for product photographer — incense line launch',
    description: 'Launching our new premium incense collection. Need warm, moody product photography. 3-day shoot in Mumbai studio. Deliverables: 40 hero shots + 20 lifestyle.',
    discipline: 'Photography', city: 'Mumbai', budgetMin: 80000, budgetMax: 150000,
    deadline: 'May 5', applicants: 23, saves: 47, hero: pic('camp1', 1200, 700), postedAgo: '2h ago',
  },
  {
    id: 'cp2', kind: 'brand',
    posterName: 'Beardo India', posterAvatar: pic('beardo', 200, 200),
    posterHandle: '@beardo', posterVerified: true,
    title: 'Wedding season reel creator — pan-India',
    description: 'Need 5 wedding reel creators for boutique wedding films this season. Delhi/Mumbai/Jaipur preferred. Travel + accommodation covered.',
    discipline: 'Videography', city: 'Multi-city', budgetMin: 60000, budgetMax: 120000,
    deadline: 'May 12', applicants: 67, saves: 89, hero: pic('camp2', 1200, 700), postedAgo: '8h ago',
  },
  {
    id: 'cp3', kind: 'creator',
    posterName: 'Vikram Iyer', posterAvatar: pic('Vikram Iyer-av', 200, 200),
    posterHandle: '@vikramanalog', posterVerified: true,
    title: 'Studio time + production — 3 tracks for indie artists',
    description: 'Opening up 3 slots for indie artists in Mumbai this May. Full production + mix + master. Tape-first workflow. My Andheri studio.',
    discipline: 'Music', city: 'Mumbai', budgetMin: 25000, budgetMax: 40000,
    deadline: 'May 20', applicants: 14, saves: 29, postedAgo: '1d ago',
  },
  {
    id: 'cp4', kind: 'brand',
    posterName: 'Paper Boat', posterAvatar: pic('paperboat', 200, 200),
    posterHandle: '@paperboat', posterVerified: true,
    title: 'Illustrator for festive campaign',
    description: 'Diwali campaign illustrations — hand-drawn, warm palette. Set of 12 illustrations for social + packaging tie-in. Work-from-anywhere.',
    discipline: 'Illustration', budgetMin: 40000, budgetMax: 80000,
    deadline: 'May 18', applicants: 52, saves: 104, hero: pic('camp4', 1200, 700), postedAgo: '2d ago',
  },
  {
    id: 'cp5', kind: 'creator',
    posterName: 'Meher Krishnan', posterAvatar: pic('Meher Krishnan-av', 200, 200),
    posterHandle: '@meherdesigns', posterVerified: true,
    title: 'Taking 1 retainer client for Q2',
    description: 'Opening one UX retainer slot — fintech or creator-tools preferred. 20 hrs/week. Bangalore remote.',
    discipline: 'UI/UX', city: 'Bangalore', budgetMin: 120000, budgetMax: 180000,
    deadline: 'May 10', applicants: 8, saves: 14, postedAgo: '3d ago',
  },
  {
    id: 'cp6', kind: 'brand',
    posterName: 'Zomato Studios', posterAvatar: pic('zomato', 200, 200),
    posterHandle: '@zomato', posterVerified: true,
    title: 'Tattoo artists for in-store popup — Delhi',
    description: 'Hosting a tattoo popup at our flagship. Looking for 4 artists for weekend event. Flat fee + tips.',
    discipline: 'Tattoo', city: 'Delhi', budgetMin: 20000, budgetMax: 35000,
    deadline: 'Apr 30', applicants: 19, saves: 22, hero: pic('camp6', 1200, 700), postedAgo: '4h ago',
  },
]

export const PAYOUT_TXNS = [
  { id: 't1', who: 'Paper Boat — Festive set', when: 'Apr 22', status: 'Released', amount: 30000, dir: 'in' as const },
  { id: 't2', who: 'Withdrawal to HDFC ••4821', when: 'Apr 20', status: 'Settled', amount: 25000, dir: 'out' as const },
  { id: 't3', who: 'Zomato — Popup event', when: 'Apr 14', status: 'Released', amount: 18000, dir: 'in' as const },
  { id: 't4', who: 'Withdrawal to HDFC ••4821', when: 'Apr 10', status: 'Settled', amount: 15000, dir: 'out' as const },
  { id: 't5', who: 'Beardo — Reel series', when: 'Apr 5', status: 'Released', amount: 22000, dir: 'in' as const },
]

export const SEED_DEALS: Deal[] = [
  {
    id: 'deal1', campaignId: 'cp4', campaignTitle: 'Illustrator for festive campaign',
    brandName: 'Paper Boat', brandAvatar: pic('paperboat', 200, 200),
    creatorName: 'Priya Joshi', creatorAvatar: pic('Priya Joshi-av', 200, 200), creatorId: 'c7',
    quote: 60000, pitch: 'Hand-drawn festive set with warm risograph textures — 12 illustrations sized for social + packaging.',
    stage: 'active',
    deliverables: [
      { name: 'Moodboard + style frames', done: true, approved: true },
      { name: 'First batch (6 illustrations)', done: true, approved: false },
      { name: 'Final batch + source files', done: false, approved: false },
    ],
    payments: [
      { name: '50% advance', amount: 30000, status: 'released' },
      { name: '50% on approval', amount: 30000, status: 'escrow' },
    ],
    agreedDate: 'Apr 18',
  },
  {
    id: 'deal2', campaignId: 'cp2', campaignTitle: 'Wedding season reel creator — pan-India',
    brandName: 'Beardo India', brandAvatar: pic('beardo', 200, 200),
    creatorName: 'Kabir Sethi', creatorAvatar: pic('Kabir Sethi-av', 200, 200), creatorId: 'c2',
    quote: 85000, pitch: 'Cinematic wedding reels for 3 ceremonies — Delhi, Jaipur, Mumbai. Delivered within 48 hrs post-event.',
    stage: 'contract',
    deliverables: [
      { name: 'Shoot day(s)', done: false, approved: false },
      { name: 'Rough cut + review', done: false, approved: false },
      { name: 'Final reels (3×60s)', done: false, approved: false },
    ],
    payments: [
      { name: '50% advance', amount: 42500, status: 'escrow' },
      { name: '50% on approval', amount: 42500, status: 'pending' },
    ],
  },
]

export const SEED_CREATOR_BOOKINGS: Booking[] = [
  { id: 'b1', clientName: 'Rhea Kapoor', clientAvatar: pic('client1', 100, 100), projectType: 'Portrait shoot', date: 'Apr 27 · 10am', price: 25000, advancePaid: 12500, status: 'upcoming' },
  { id: 'b2', clientName: 'Aryan Mehta', clientAvatar: pic('client2', 100, 100), projectType: 'Product photography', date: 'Apr 29 · 2pm', price: 18000, advancePaid: 9000, status: 'upcoming' },
  { id: 'b3', clientName: 'Sneha Gupta', clientAvatar: pic('client3', 100, 100), projectType: 'Brand identity kit', date: 'Apr 22 · Done', price: 45000, advancePaid: 45000, status: 'pending' },
  { id: 'b4', clientName: 'Vikram Nair', clientAvatar: pic('client4', 100, 100), projectType: 'Wedding film', date: 'Apr 12 · Done', price: 80000, advancePaid: 80000, status: 'completed' },
  { id: 'b5', clientName: 'Tanya Sood', clientAvatar: pic('client5', 100, 100), projectType: 'Strategy consult', date: 'Apr 8 · Done', price: 5000, advancePaid: 5000, status: 'completed' },
  { id: 'b6', clientName: 'Rohan Sharma', clientAvatar: pic('client6', 100, 100), projectType: 'Editorial shoot', date: 'Awaiting reply', price: 35000, advancePaid: 0, status: 'inquiry' },
  { id: 'b7', clientName: 'Priya Jain', clientAvatar: pic('client7', 100, 100), projectType: 'Reel editing — 5 videos', date: 'Budget question', price: 12000, advancePaid: 0, status: 'inquiry' },
]

export const SEED_QUOTES: Quote[] = [
  { id: 'q1', scope: 'Editorial shoot · 2 looks', price: 35000, delivery: '5 business days', note: 'Includes 20 edited selects.', status: 'sent', createdAt: 'Apr 20' },
  { id: 'q2', scope: 'Reel editing — 5 videos', price: 12000, delivery: '3 days per reel', note: 'Each reel up to 60s, colour graded.', status: 'paid', createdAt: 'Apr 18' },
]

export const RECEIVED_REVIEWS = [
  { id: 'r1', clientName: 'Rhea Kapoor', clientAvatar: pic('client1', 200, 200), rating: 5.0, project: 'Portrait shoot', date: 'Apr 22', text: 'Absolutely stunning work. The lighting and composition were perfect, and the edits came back in just 3 days.', helpful: 4 },
  { id: 'r2', clientName: 'Aryan Mehta', clientAvatar: pic('client2', 200, 200), rating: 4.8, project: 'Product photography', date: 'Apr 18', text: 'Great product shots for our skincare launch. Very professional, arrived on time, great equipment.', helpful: 2 },
  { id: 'r3', clientName: 'Sneha Gupta', clientAvatar: pic('client3', 200, 200), rating: 5.0, project: 'Wedding film', date: 'Mar 30', text: 'Captured every emotion of our day perfectly. The film made us cry happy tears.', helpful: 9 },
]

export const NOTIF_META: Record<string, { emoji: string; color: string }> = {
  booking: { emoji: '📸', color: '#EFECFE' },
  payment: { emoji: '💰', color: '#DCFCE7' },
  review: { emoji: '⭐', color: '#FEF9C3' },
  message: { emoji: '💬', color: '#E0F2FE' },
  campaign: { emoji: '📣', color: '#FEE2E2' },
  platform: { emoji: '🔔', color: '#F4F1EA' },
}

export const DEFAULT_FILTERS = {
  discipline: 'All',
  subSkills: [] as string[],
  city: 'Delhi',
  localities: [] as string[],
  languages: [] as string[],
  travel: 'any' as const,
  distance: 20,
  gender: 'Any',
  availableToday: false,
  budgetMin: 0,
  budgetMax: 200000,
  rating: 0,
}
