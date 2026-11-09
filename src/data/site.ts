// Site-wide settings and navigation. Page content lives in src/content/.
export const site = {
  name: 'NPG Tech Solutions',
  tagline: 'Practical technology. Real-world solutions.',
  description:
    'NPG Tech Solutions works with individuals, businesses and organisations to identify problems, develop practical digital solutions and deliver technology that makes work simpler, smarter and more effective.',
  location: 'Remote — working with clients worldwide',
};

export const mainNav = [
  { label: 'Services', href: '/services' },
  { label: 'How We Work', href: '/how-we-work' },
  { label: 'Our Work', href: '/our-work' },
  { label: 'Our Team', href: '/team' },
  { label: 'About', href: '/about' },
];

export const ctaLinks = {
  request: { label: 'Discuss a Project', href: '/contact' },
  conversation: { label: 'Start a Conversation', href: '/contact' },
  join: { label: 'Join our team', href: '/join-our-team' },
};

export const footerNav = [
  {
    heading: 'Explore',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Services', href: '/services' },
      { label: 'How We Work', href: '/how-we-work' },
      { label: 'Our Work', href: '/our-work' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'Our team', href: '/team' },
      { label: 'About us', href: '/about' },
      { label: 'Join us', href: '/join-our-team' },
    ],
  },
];
