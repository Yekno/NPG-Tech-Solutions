// Site-wide settings and navigation. Page content lives in src/content/.
export const site = {
  name: 'NPG Tech Solutions',
  tagline: 'Digital Solutions • IT Support • Digital Skills',
  description:
    'NPG Tech Solutions is a digital solutions company delivering web development, UI/UX, e-commerce, IT support and digital skills training for businesses.',
  location: 'Remote — working with clients worldwide',
};

export const mainNav = [
  { label: 'Services', href: '/services' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Team', href: '/team' },
  { label: 'About', href: '/about' },
  { label: 'Testimonials', href: '/testimonials' },
];

export const ctaLinks = {
  request: { label: 'Request a project', href: '/request-a-project' },
  careers: { label: 'Join our team', href: '/careers' },
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
    heading: 'Company',
    links: [
      { label: 'Our team', href: '/team' },
      { label: 'About us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Request a project', href: '/request-a-project' },
    ],
  },
];
