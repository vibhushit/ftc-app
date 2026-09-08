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
