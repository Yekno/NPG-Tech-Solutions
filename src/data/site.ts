// Site-wide settings and navigation. Page content lives in src/content/.
export const site = {
  name: 'NPG Tech Solutions',
  tagline: 'Practical technology. Real-world solutions.',
  description:
    'NPG Tech Solutions works with individuals, businesses and organisations to identify problems, develop practical digital solutions and deliver technology and design that make work simpler, smarter and more effective.',
};

// How to reach the company. Used by the Contact page and the footer.
export const contact = {
  email: 'npgsolutions2026@outlook.com',
  phone: '+234 813 386 9304',
  tel: '+2348133869304',
  whatsapp: 'https://wa.me/2348133869304',
  location: 'Remotely',
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

export const legalLinks = [{ label: 'Privacy Notice', href: '/privacy' }];

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
