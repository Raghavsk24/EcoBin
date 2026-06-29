// Disposal pathway display metadata for the quiz. Exactly three pathways:
// Recycling, Compost, Garbage.

export type Pathway = 'recycling' | 'compost' | 'garbage';

export const PATHWAY_LABEL: Record<Pathway, string> = {
  recycling: 'Recycling',
  compost:   'Compost',
  garbage:   'Garbage',
};

// EcoBin brand colors: blue for recycling, green for compost, slate for garbage.
export const PATHWAY_COLOR: Record<Pathway, string> = {
  recycling: '#1973e6',
  compost:   '#47b868',
  garbage:   '#4b5563',
};

export const PATHWAY_BLURB: Record<Pathway, string> = {
  recycling: 'Place this in your recycling bin.',
  compost:   'Add this to your compost bin or pile.',
  garbage:   'Goes in the regular trash bin.',
};

export function prettifyClassName(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
