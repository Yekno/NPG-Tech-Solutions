// The six approved process stages (PRD). Single source for the home page preview and /how-we-work,
// so the two can never drift apart. Order here is the order shown; numbers are derived from it.
export interface Stage {
  title: string;
  text: string;
}

export const stages: Stage[] = [
  {
    title: 'Understand',
    text: 'We listen to your needs, ask questions and clarify the problem, intended users and the outcome you want to achieve.',
  },
  {
    title: 'Define',
    text: 'We document the requirements, identify the proposed scope and agree on expected deliverables, responsibilities and constraints.',
  },
  {
    title: 'Plan',
    text: 'We determine the approach, resources, milestones and communication arrangements appropriate to the project.',
  },
  {
    title: 'Build or Implement',
    text: 'Our team and approved project contributors carry out the agreed work, share progress and raise issues that may affect delivery.',
  },
  {
    title: 'Test and Review',
    text: "We review the solution against the agreed requirements, address identified issues and obtain the client's feedback.",
  },
  {
    title: 'Deliver and Support',
    text: 'We hand over the agreed deliverables and discuss any maintenance, updates or further support separately where required.',
  },
];
