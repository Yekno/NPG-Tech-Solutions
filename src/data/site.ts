// Site-wide settings and navigation. Page content lives in src/content/.
export const site = {
  name: 'NPG Tech Solutions',
  tagline: 'Digital Solutions • IT Support • Digital Skills',
  description:
    'NPG Tech Solutions is a community of web developers and designers building fast, modern websites, apps and online stores for businesses.',
  location: 'Remote — working with clients worldwide',
};

export const mainNav = [
  { label: 'Services', href: '/services' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Developers', href: '/developers' },
  { label: 'About', href: '/about' },
  { label: 'Testimonials', href: '/testimonials' },
];

export const ctaLinks = {
  request: { label: 'Request a project', href: '/request-a-project' },
  join: { label: 'Join the community', href: '/join' },
};

export const footerNav = [
  {
    heading: 'Explore',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Services', href: '/services' },
      { label: 'Portfolio', href: '/portfolio' },
      { label: 'Testimonials', href: '/testimonials' },
    ],
  },
  {
    heading: 'Community',
    links: [
      { label: 'Our developers', href: '/developers' },
      { label: 'About us', href: '/about' },
      { label: 'Join the community', href: '/join' },
      { label: 'Request a project', href: '/request-a-project' },
    ],
  },
];
