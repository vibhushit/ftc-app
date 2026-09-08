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
  { key: 'pending_approval', label: 'Requests' },
  { key: 'inquiry', label: 'Inquiries' },
  { key: 'upcoming', label: 'Advance Paid' },
  { key: 'pending', label: 'Pending Delivery' },
  { key: 'completed', label: 'Completed' },
]

export const CRM_EMPTY: Record<string, [string, string]> = {
  pending_approval: ['No pending booking requests', 'New booking requests requiring your approval within 24 hours will appear here.'],
  inquiry: ['New leads land here', "When a client messages or requests a quote, you'll see them in this column."],
  upcoming: ['No upcoming sessions', 'Bookings with a deposit paid show here with their date & time.'],
  pending: ['Nothing in delivery', 'Active jobs awaiting final delivery appear here.'],
  completed: ['No completed jobs yet', 'Finished jobs with full payment released are archived here.'],
}

export const pic = (seed: string, w = 800, h = 800) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`

export const inr = (n: number) =>
  `₹${n.toLocaleString('en-IN')}`

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
