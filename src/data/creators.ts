import type { Creator } from '@/types'
import { CITIES, AREA_COORDS, pic } from './constants'

export const DISCIPLINE_CONFIG: Record<string, {
  sub: string[]
  basePrice: number
  color: string
  inclusions: string[]
}> = {
  Photography: {
    sub: ['Wedding', 'Pre-wedding', 'Product', 'Fashion', 'Maternity', 'Newborn', 'Editorial', 'Portrait', 'Event', 'Corporate', 'Food'],
    basePrice: 8000, color: '#7D61F2',
    inclusions: ['Up to 50 edited photos', '100+ edited photos', 'All high-res digitals', 'Candid + posed', '1 location', '2 locations', 'Same-day sneak peeks', 'Drone coverage', 'Second shooter', 'Printed photo album', 'Hair & makeup coordination', 'Travel within city'],
  },
  Videography: {
    sub: ['Wedding film', 'Pre-wedding film', 'Brand film', 'Music video', 'Short film', 'Reel', 'Event', 'Documentary'],
    basePrice: 15000, color: '#E2435A',
    inclusions: ['60-sec teaser', '3-5 min highlight film', '4K footage', 'Two-camera setup', 'Drone coverage', 'Same-day edit', 'Licensed background music', 'Raw footage handover', '3 vertical reels', 'Travel within city'],
  },
  'Graphic Design': {
    sub: ['Brand identity', 'Logo', 'Packaging', 'Social media', 'Print', 'Infographic', 'Wedding invites'],
    basePrice: 6000, color: '#DBFF4D',
    inclusions: ['Logo + wordmark', 'Brand guidelines', 'Source files (AI/PSD)', '3 concept directions', 'Social media kit', 'Print-ready files', 'Unlimited revisions', 'Packaging dielines'],
  },
  'UI/UX': {
    sub: ['Mobile app', 'Web', 'Design system', 'Landing page', 'Product', 'Prototype'],
    basePrice: 12000, color: '#7D61F2',
    inclusions: ['User flows', 'Wireframes', 'Hi-fi mockups', 'Interactive prototype', 'Design system', 'Developer handoff (Figma)', 'Responsive screens', '2 revision rounds'],
  },
  Writing: {
    sub: ['Copywriting', 'Long-form', 'Script', 'Technical', 'SEO', 'Bilingual'],
    basePrice: 4000, color: '#16A34A',
    inclusions: ['SEO optimised', 'Up to 1000 words', 'Keyword research', 'Meta descriptions', 'Tone & style guide', '2 revision rounds', 'Plagiarism report', 'Bilingual (EN/HI)'],
  },
  Music: {
    sub: ['Production', 'Mixing', 'Mastering', 'Session', 'Scoring', 'Jingle'],
    basePrice: 10000, color: '#E2435A',
    inclusions: ['Full production', 'Mixing', 'Mastering', 'Session musician', 'Stems delivery', 'Commercial license', 'Reference matching', '2 revision rounds'],
  },
  Tattoo: {
    sub: ['Fine line', 'Blackwork', 'Traditional', 'Realism', 'Script', 'Cover-up'],
    basePrice: 5000, color: '#141414',
    inclusions: ['Custom design consult', 'Stencil included', 'Free touch-up session', 'Aftercare kit', 'Numbing cream', 'Private studio session', 'Cover-up work', 'Colour / Black & grey'],
  },
  Illustration: {
    sub: ['Editorial', "Children's", 'Digital', 'Portrait', 'Risograph', 'Caricature'],
    basePrice: 5000, color: '#DBFF4D',
    inclusions: ['Up to 3 concepts', 'Source files', 'Print-ready', 'Commercial usage rights', 'Hand-drawn', 'Character sheet', '2 revision rounds'],
  },
  Editing: {
    sub: ['Video', 'Photo', 'Reel', 'Color grading', 'Podcast'],
    basePrice: 5000, color: '#16A34A',
    inclusions: ['Color grading', 'Up to 3 min', '3 reels cut', 'Sound design', 'Subtitles', 'Motion graphics', '2 revision rounds'],
  },
  Dance: {
    sub: ['Wedding', 'Sangeet', 'Event', 'Classical', 'Hip-hop', 'Choreography'],
    basePrice: 8000, color: '#7D61F2',
    inclusions: ['Choreography', '2 rehearsals', 'Costume guidance', 'Group routine', 'Stage formations', 'Music editing', 'On-stage performance'],
  },
}

const FEATURED_SEED = [
  { name: 'Ananya Desai', handle: '@ananyashoots', discipline: 'Photography', subSkills: ['Wedding', 'Pre-wedding', 'Editorial'], city: 'Mumbai', area: 'Bandra', tagline: 'Cinematic weddings, honest portraits.', languages: ['English', 'Hindi', 'Marathi'] },
  { name: 'Kabir Sethi', handle: '@kabirframes', discipline: 'Videography', subSkills: ['Wedding film', 'Brand film', 'Music video'], city: 'Delhi', area: 'Hauz Khas', tagline: 'Brand films that move you before they sell you.', languages: ['English', 'Hindi', 'Punjabi'] },
  { name: 'Meher Krishnan', handle: '@meherdesigns', discipline: 'UI/UX', subSkills: ['Mobile app', 'Design system', 'Product'], city: 'Bangalore', area: 'Indiranagar', tagline: 'Fintech & SaaS interfaces that ship.', languages: ['English', 'Tamil'] },
  { name: 'Aarav Mehta', handle: '@aaravinkstudio', discipline: 'Tattoo', subSkills: ['Fine line', 'Blackwork', 'Botanical'], city: 'Bangalore', area: 'Koramangala', tagline: 'Fine-line portraiture, by appointment.', languages: ['English', 'Hindi', 'Kannada'] },
  { name: 'Ishita Banerjee', handle: '@ishita.writes', discipline: 'Writing', subSkills: ['Copy', 'Long-form', 'Bilingual'], city: 'Kolkata', area: 'Park Street', tagline: 'Brand voice in English and Hindi.', languages: ['English', 'Hindi', 'Bengali'] },
  { name: 'Vikram Iyer', handle: '@vikramanalog', discipline: 'Music', subSkills: ['Production', 'Mixing', 'Mastering'], city: 'Mumbai', area: 'Andheri', tagline: 'Tape-first mixing for indie artists.', languages: ['English', 'Hindi', 'Tamil'] },
  { name: 'Priya Joshi', handle: '@priya.illus', discipline: 'Illustration', subSkills: ['Editorial', 'Risograph'], city: 'Pune', area: 'Kothrud', tagline: 'Editorial illustration with printmaker sensibility.', languages: ['English', 'Hindi', 'Marathi'] },
  { name: 'Rohan Kapoor', handle: '@rohankapoor.grafik', discipline: 'Graphic Design', subSkills: ['Brand identity', 'Packaging'], city: 'Delhi', area: 'Saket', tagline: 'Identity systems for hospitality + DTC.', languages: ['English', 'Hindi'] },
  { name: 'Saniya Rao', handle: '@saniyashoots', discipline: 'Photography', subSkills: ['Product', 'Fashion', 'Editorial'], city: 'Mumbai', area: 'Juhu', tagline: 'Clean light, clean product, clean edit.', languages: ['English', 'Hindi'] },
  { name: 'Arjun Nair', handle: '@arjun.edits', discipline: 'Editing', subSkills: ['Video', 'Reel', 'Color grading'], city: 'Kochi', area: 'Panampilly Nagar', tagline: 'Post for music videos and reels.', languages: ['English', 'Malayalam', 'Hindi'] },
  { name: 'Nikita Shah', handle: '@nikitadesigns', discipline: 'Graphic Design', subSkills: ['Social', 'Print', 'Packaging'], city: 'Ahmedabad', area: 'Navrangpura', tagline: 'Packaging for FMCG + wellness brands.', languages: ['English', 'Hindi', 'Gujarati'] },
  { name: 'Yash Pillai', handle: '@yashframe', discipline: 'Videography', subSkills: ['Music video', 'Documentary'], city: 'Bangalore', area: 'HSR Layout', tagline: 'Indie music video specialist.', languages: ['English', 'Tamil', 'Hindi'] },
  { name: 'Devika Raj', handle: '@devikadance', discipline: 'Dance', subSkills: ['Wedding', 'Classical'], city: 'Chennai', area: 'T. Nagar', tagline: 'Bharatanatyam + choreography for weddings.', languages: ['Tamil', 'English', 'Hindi'] },
  { name: 'Akshay Bhatt', handle: '@akshayink', discipline: 'Tattoo', subSkills: ['Realism', 'Blackwork'], city: 'Goa', area: 'Assagao', tagline: 'Realism in Goa, walk-ins weekends.', languages: ['English', 'Hindi', 'Konkani'] },
  { name: 'Riya Malhotra', handle: '@riyawrites', discipline: 'Writing', subSkills: ['Copy', 'Script'], city: 'Delhi', area: 'Defence Colony', tagline: 'D2C copy and ad scripts.', languages: ['English', 'Hindi'] },
  { name: 'Harsh Gupta', handle: '@harshpixel', discipline: 'UI/UX', subSkills: ['Web', 'Landing', 'Product'], city: 'Pune', area: 'Koregaon Park', tagline: 'Landing pages that actually convert.', languages: ['English', 'Hindi', 'Marathi'] },
  { name: 'Tara Sharma', handle: '@tarasphoto', discipline: 'Photography', subSkills: ['Maternity', 'Portrait', 'Family'], city: 'Chandigarh', area: 'Sector 17', tagline: 'Maternity & newborn, 8 years in.', languages: ['English', 'Hindi', 'Punjabi'] },
  { name: 'Zain Ali', handle: '@zainsounds', discipline: 'Music', subSkills: ['Production', 'Scoring'], city: 'Mumbai', area: 'Worli', tagline: 'Film scoring + song production.', languages: ['English', 'Hindi', 'Urdu'] },
  { name: 'Pooja Hegde', handle: '@pooja.illus', discipline: 'Illustration', subSkills: ["Children's", 'Digital'], city: 'Hyderabad', area: 'Jubilee Hills', tagline: "Children's books + digital editorial.", languages: ['English', 'Telugu', 'Hindi'] },
  { name: 'Siddharth Menon', handle: '@sidframes', discipline: 'Videography', subSkills: ['Wedding film', 'Reel'], city: 'Jaipur', area: 'C-Scheme', tagline: 'Wedding cinema with documentary soul.', languages: ['English', 'Hindi', 'Rajasthani'] },
]

const INDIAN_FIRST = ['Aryan','Kavya','Neha','Rahul','Sneha','Aditya','Pooja','Vivek','Ritika','Karan','Divya','Sanjay','Aisha','Ayaan','Natasha','Rohit','Shruti','Nikhil','Maya','Ayush','Shreya','Tanvi','Akash','Rhea','Dev','Meera','Siddhi','Kunal','Anjali','Saurav','Leela','Abhinav','Nidhi','Tarun','Kritika','Ashish','Bhavana','Vineet','Laya','Farhan','Zoya','Amit','Ira','Pranav','Aarohi','Manav','Simran','Rajat','Tanya','Omkar','Ashwini','Varun','Anoushka','Amar','Gayatri','Yash','Kiran','Dhruv','Mahika','Raghav','Ishan']
const INDIAN_LAST  = ['Sharma','Patel','Singh','Kumar','Gupta','Agarwal','Jain','Verma','Reddy','Nair','Iyer','Pillai','Menon','Rao','Bose','Khurana','Arora','Malhotra','Chopra','Kapoor','Chatterjee','Mukherjee','Banerjee','Das','Dutta','Naidu','Pai','Shetty','Hegde','Bhat','Desai','Joshi','Sethi','Anand','Tiwari','Mehra','Khanna','Ahuja','Saxena','Bajaj','Gulati','Thakur','Yadav','Sinha','Mathur','Kaul','Bakshi','Dalal','Bhasin','Sood']
const FEMALE_NAMES = new Set(['Ananya','Meher','Ishita','Priya','Saniya','Tara','Pooja','Devika','Riya','Nikita','Kavya','Neha','Sneha','Ritika','Divya','Aisha','Natasha','Shruti','Maya','Shreya','Tanvi','Rhea','Meera','Siddhi','Anjali','Leela','Nidhi','Kritika','Bhavana','Zoya','Ira','Aarohi','Simran','Tanya','Ashwini','Anoushka','Gayatri','Mahika'])

function buildCreators(): Creator[] {
  const roster: Creator[] = []

  FEATURED_SEED.forEach((s, i) => {
    const cfg = DISCIPLINE_CONFIG[s.discipline]
    const tierSeed = (i * 7) % 4
    const tier = tierSeed === 0 ? 'Platinum' : tierSeed === 1 ? 'Gold' : tierSeed === 2 ? 'Silver' : 'Rising'
    const priceMult = tier === 'Platinum' ? 2.8 : tier === 'Gold' ? 1.8 : tier === 'Silver' ? 1.2 : 0.8

    roster.push({
      id: `c${i + 1}`,
      name: s.name, handle: s.handle,
      discipline: s.discipline, subSkills: s.subSkills,
      city: s.city, area: s.area,
      avatar: pic(s.name + '-av', 200, 200),
      portfolio: [pic(s.name + '-1', 1200, 1500), pic(s.name + '-2', 1200, 1200), pic(s.name + '-3', 1200, 1200), pic(s.name + '-4', 1200, 1200)],
      rating: +(4.6 + (i * 37 % 40) / 100).toFixed(2),
      reviews: 40 + (i * 13 % 220),
      startingAt: Math.round(cfg.basePrice * priceMult),
      yearsExp: 3 + (i * 3 % 10),
      completed: 35 + (i * 17 % 400),
      rise: `+${8 + (i * 11 % 50)}%`,
      tier, verification: tier === 'Platinum' || tier === 'Gold' ? 'vetted' : tier === 'Silver' ? 'id' : 'phone',
      isPro: tier !== 'Rising' && i % 3 === 0,
      responseTime: tier === 'Platinum' ? '~15 min' : tier === 'Gold' ? '~45 min' : '~2 hrs',
      nextSlot: ['Today 6pm', 'Tomorrow 9am', 'Apr 28', 'Apr 30', 'May 2', 'May 5'][i % 6],
      languages: s.languages, tagline: s.tagline,
      availability: Array.from({ length: 28 }, (_, d) => ((d * 7 + i * 3) % 11) > 3 ? 1 : 0),
      repeatRate: 0.2 + (i * 5 % 60) / 100,
      travelRadius: (['city', 'state', 'nation'] as const)[i % 3],
      gender: FEMALE_NAMES.has(s.name.split(' ')[0]) ? 'female' : (i % 9 === 4 ? 'non-binary' : 'male'),
      trustScore: Math.min(100, 55 + (tier === 'Platinum' ? 38 : tier === 'Gold' ? 28 : tier === 'Silver' ? 16 : 6) + (i * 3 % 7)),
      availableToday: ((i * 7) % 11) > 3,
      travelMode: (s.discipline === 'Tattoo' || s.discipline === 'Music') ? (i % 4 === 0 ? 'both' : 'studio') : (i % 3 === 0 ? 'both' : i % 3 === 1 ? 'travel' : 'studio'),
      oneOnOne: {
        name: ({ Photography: '1:1 Portfolio Review', Videography: '1:1 Film Planning Call', Music: '1:1 Production Call', 'Graphic Design': '1:1 Brand Consult', 'UI/UX': '1:1 Product Strategy', Writing: '1:1 Content Strategy', Tattoo: '1:1 Design Consult', Illustration: '1:1 Concept Call', Editing: '1:1 Edit Review', Dance: '1:1 Choreo Consult' } as Record<string,string>)[s.discipline] || '1:1 Strategy Call',
        mins: [20, 30, 45][i % 3], price: [499, 999, 1499][i % 3],
        type: ['Video call', 'Phone call', 'In person'][i % 3], today: i % 2 === 0,
      },
      ...(AREA_COORDS[s.area] ? {
        lat: AREA_COORDS[s.area][0] + ((i % 5) - 2) * 0.004,
        lng: AREA_COORDS[s.area][1] + ((i % 4) - 2) * 0.004,
      } : {}),
    })
  })

  const disciplines = Object.keys(DISCIPLINE_CONFIG)
  const weights = [22, 18, 14, 10, 10, 8, 6, 5, 4, 3]
  const weighted: string[] = []
  disciplines.forEach((d, i) => { for (let k = 0; k < weights[i]; k++) weighted.push(d) })
  const cityKeys = Object.keys(CITIES)

  let idx = FEATURED_SEED.length
  while (roster.length < 28) {
    const first = INDIAN_FIRST[idx % INDIAN_FIRST.length]
    const last = INDIAN_LAST[(idx * 3) % INDIAN_LAST.length]
    const name = `${first} ${last}`
    const disc = weighted[idx % weighted.length]
    const cfg = DISCIPLINE_CONFIG[disc]
    const city = cityKeys[(idx * 3) % cityKeys.length]
    const areas = CITIES[city]
    const area = areas[idx % areas.length]
    const tierSeed = (idx * 5) % 10
    const tier = tierSeed < 2 ? 'Platinum' : tierSeed < 5 ? 'Gold' : tierSeed < 8 ? 'Silver' : 'Rising'
    const priceMult = tier === 'Platinum' ? 2.5 : tier === 'Gold' ? 1.6 : tier === 'Silver' ? 1.1 : 0.75
    const subs = cfg.sub
    const skills: string[] = []
    const subCount = 2 + (idx % 2)
    for (let k = 0; k < subCount; k++) skills.push(subs[(idx + k) % subs.length])

    roster.push({
      id: `c${idx + 1}`,
      name, handle: `@${first.toLowerCase()}${last.toLowerCase().slice(0, 3)}`,
      discipline: disc, subSkills: skills,
      city, area,
      avatar: pic(name + '-av', 200, 200),
      portfolio: [pic(name + '-1', 1200, 1500), pic(name + '-2', 1200, 1200), pic(name + '-3', 1200, 1200)],
      rating: +(4.2 + (idx * 41 % 70) / 100).toFixed(2),
      reviews: 5 + (idx * 7 % 180),
      startingAt: Math.round(cfg.basePrice * priceMult),
      yearsExp: 2 + (idx * 2 % 12),
      completed: 10 + (idx * 11 % 300),
      rise: `+${5 + (idx * 13 % 40)}%`,
      tier, verification: tier === 'Rising' ? 'phone' : (idx % 3 === 0 ? 'vetted' : 'id'),
      isPro: tier !== 'Rising' && idx % 4 === 0,
      responseTime: tier === 'Platinum' ? '~20 min' : tier === 'Gold' ? '~1 hr' : tier === 'Silver' ? '~3 hrs' : '~8 hrs',
      nextSlot: ['Today', 'Tomorrow', 'Apr 27', 'Apr 28', 'Apr 29', 'Apr 30', 'May 1', 'May 2', 'May 3', 'May 5'][idx % 10],
      languages: ['English', 'Hindi', ...(idx % 3 === 0 ? ['Tamil'] : idx % 3 === 1 ? ['Marathi'] : ['Bengali'])].slice(0, 3),
      tagline: [
        'Independent ' + disc.toLowerCase() + '. Reliable timelines.',
        'Professional ' + disc.toLowerCase() + ' for select projects.',
        'Working in ' + city + '. Travels for the right brief.',
        skills[0] + ' specialist, ' + (2 + (idx % 10)) + ' years in.',
      ][idx % 4],
      availability: Array.from({ length: 28 }, (_, d) => ((d * 5 + idx * 7) % 13) > 4 ? 1 : 0),
      repeatRate: 0.15 + (idx * 11 % 55) / 100,
      travelRadius: (['city', 'state', 'nation'] as const)[idx % 3],
      gender: FEMALE_NAMES.has(first) ? 'female' : (idx % 9 === 4 ? 'non-binary' : 'male'),
      trustScore: Math.min(100, 55 + (tier === 'Platinum' ? 38 : tier === 'Gold' ? 28 : tier === 'Silver' ? 16 : 6) + (idx * 3 % 7)),
      availableToday: ((idx * 5) % 13) > 4,
      travelMode: (disc === 'Tattoo' || disc === 'Music') ? (idx % 4 === 0 ? 'both' : 'studio') : (idx % 3 === 0 ? 'both' : idx % 3 === 1 ? 'travel' : 'studio'),
      oneOnOne: {
        name: 'Strategy call',
        mins: [20, 30, 45][idx % 3], price: [499, 999, 1499][idx % 3],
        type: ['Video call', 'Phone call', 'In person'][idx % 3], today: idx % 2 === 0,
      },
    })
    idx++
  }
  return roster
}

export const CREATORS: Creator[] = buildCreators()
