// Disposal pathway display metadata. Used by the result card and the quiz.

export type Pathway =
  | 'curbside_recycling'
  | 'dropoff_recycling'
  | 'compost'
  | 'garbage';

export const PATHWAY_LABEL: Record<Pathway, string> = {
  curbside_recycling: 'Curbside Recycling',
  dropoff_recycling:  'Drop-off Recycling',
  compost:            'Compost',
  garbage:            'Garbage',
};

export const PATHWAY_BG: Record<Pathway, string> = {
  curbside_recycling: 'bg-pathway-curbside',
  dropoff_recycling:  'bg-pathway-dropoff',
  compost:            'bg-pathway-compost',
  garbage:            'bg-pathway-garbage',
};

export const PATHWAY_BLURB: Record<Pathway, string> = {
  curbside_recycling: 'Place in your blue curbside recycling bin.',
  dropoff_recycling:  'Take this to a specialty recycling drop-off (grocery store bins, e-waste depots, etc.).',
  compost:            'Add this to your green compost bin or backyard compost pile.',
  garbage:            'Goes in the regular trash bin.',
};

export function prettifyClassName(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
