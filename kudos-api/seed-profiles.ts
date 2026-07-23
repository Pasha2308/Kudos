import { db } from './src/config/firebase';

const PROFILES = [
  {
    name: 'Priya Sharma',
    role: 'Founder',
    tagline: 'Building things that matter.',
    location: 'Mumbai, India',
    bio: 'Love honest conversations at 2am. Currently building a fintech startup focused on underserved markets.',
    personalityTags: ['Builder', 'Design-minded', 'Night owl', 'Cofounder-minded'],
    values: ['Transparency', 'Ambition'],
    workStyle: 'async',
    lifeStage: 'building',
    builderMode: true,
    onboardingComplete: true
  },
  {
    name: 'Arjun Kapoor',
    role: 'Software Engineer',
    tagline: 'Serial overthinker.',
    location: 'Delhi, India',
    bio: 'I process life through long conversations. I enjoy deep dives into distributed systems and philosophical debates.',
    personalityTags: ['Technical', 'Introvert', 'Deep Thinker'],
    values: ['Curiosity', 'Loyalty'],
    workStyle: 'sync',
    lifeStage: 'exploring',
    builderMode: true,
    onboardingComplete: true
  },
  {
    name: 'Sarah Jenkins',
    role: 'Product Designer',
    tagline: 'Making pixels look good.',
    location: 'London, UK',
    bio: 'Obsessed with user psychology. When I am not pushing pixels, I am hiking or reading sci-fi.',
    personalityTags: ['Creative', 'Empath', 'Extrovert'],
    values: ['Empathy', 'Aesthetics'],
    workStyle: 'async',
    lifeStage: 'stable',
    builderMode: false,
    onboardingComplete: true
  },
  {
    name: 'David Chen',
    role: 'Growth Marketer',
    tagline: 'Data beats opinions.',
    location: 'San Francisco, CA',
    bio: 'Ex-YC founder, now helping early-stage startups figure out their GTM. Always up for a quick chat about growth loops.',
    personalityTags: ['Analytical', 'Direct', 'Extrovert', 'Builder'],
    values: ['Data-driven', 'Honesty'],
    workStyle: 'async',
    lifeStage: 'building',
    builderMode: true,
    onboardingComplete: true
  },
  {
    name: 'Elena Rodriguez',
    role: 'Venture Capitalist',
    tagline: 'Funding the next big thing.',
    location: 'New York, NY',
    bio: 'Looking for bold founders who are not afraid to challenge the status quo. I appreciate radical candor and big visions.',
    personalityTags: ['Direct', 'Visionary', 'Investigator'],
    values: ['Boldness', 'Integrity'],
    workStyle: 'sync',
    lifeStage: 'stable',
    builderMode: false,
    onboardingComplete: true
  },
  {
    name: 'Kenji Sato',
    role: 'Indie Hacker',
    tagline: 'Bootstrapping my way to freedom.',
    location: 'Tokyo, Japan',
    bio: 'Solo founder juggling 5 micro-SaaS projects. Trying to balance intense coding sprints with mindfulness.',
    personalityTags: ['Builder', 'Independent', 'Mindful'],
    values: ['Freedom', 'Focus'],
    workStyle: 'async',
    lifeStage: 'building',
    builderMode: true,
    onboardingComplete: true
  },
  {
    name: 'Aisha Patel',
    role: 'Community Manager',
    tagline: 'Connecting dots and people.',
    location: 'Toronto, Canada',
    bio: 'I love bringing people together. Host of a weekly tech meetup. Always looking to make warm introductions.',
    personalityTags: ['Connector', 'Empath', 'Extrovert'],
    values: ['Community', 'Kindness'],
    workStyle: 'sync',
    lifeStage: 'stable',
    builderMode: false,
    onboardingComplete: true
  },
  {
    name: 'Marcus Johnson',
    role: 'DevOps Engineer',
    tagline: 'Keeping the lights on.',
    location: 'Austin, TX',
    bio: 'Infrastructure nerd. I automate everything so I have more time to spend with my golden retriever.',
    personalityTags: ['Technical', 'Pragmatic', 'Dog lover'],
    values: ['Reliability', 'Efficiency'],
    workStyle: 'async',
    lifeStage: 'stable',
    builderMode: false,
    onboardingComplete: true
  },
  {
    name: 'Chloe Kim',
    role: 'Creative Director',
    tagline: 'Storytelling through design.',
    location: 'Seoul, South Korea',
    bio: 'Believes that every brand has a unique story. I help founders articulate their vision visually.',
    personalityTags: ['Creative', 'Visionary', 'Detail-oriented'],
    values: ['Creativity', 'Authenticity'],
    workStyle: 'sync',
    lifeStage: 'exploring',
    builderMode: true,
    onboardingComplete: true
  },
  {
    name: 'Omar Hassan',
    role: 'AI Researcher',
    tagline: 'Teaching machines to think.',
    location: 'Dubai, UAE',
    bio: 'Fascinated by the intersection of AI and human psychology. Currently exploring LLMs for mental health applications.',
    personalityTags: ['Academic', 'Deep Thinker', 'Curious'],
    values: ['Knowledge', 'Impact'],
    workStyle: 'async',
    lifeStage: 'building',
    builderMode: true,
    onboardingComplete: true
  }
];

async function seedProfiles() {
  console.log('🌱 Seeding 10 realistic human profiles...');
  try {
    for (const [index, profile] of PROFILES.entries()) {
      const id = `seeded_human_${index + 1}`;
      await db.collection('users').doc(id).set(profile);
      console.log(`✅ Created profile: ${profile.name}`);
    }
    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
}

seedProfiles();
