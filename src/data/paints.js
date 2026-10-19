export const PAINTS = [
  { id: 'white', name: 'Reveal White', hex: '#EEF0F2', metalness: 0.2, roughness: 0.25, swatch: '#EEF0F2' },
  { id: 'black', name: 'Solid Black', hex: '#0E0F11', metalness: 0.1, roughness: 0.2, swatch: '#16171A' },
  { id: 'silver', name: 'Midnight Silver', hex: '#5A6068', metalness: 0.75, roughness: 0.28, swatch: '#5E646C' },
  { id: 'red', name: 'Ultra Red', hex: '#A3080E', metalness: 0.35, roughness: 0.22, swatch: '#B10C12' },
  { id: 'blue', name: 'Deep Blue', hex: '#14295C', metalness: 0.55, roughness: 0.25, swatch: '#1B3370' },
  { id: 'quicksilver', name: 'Quicksilver', hex: '#B9BEC4', metalness: 0.9, roughness: 0.18, swatch: '#C3C8CE' },
];

export const paintById = (id) => PAINTS.find((p) => p.id === id) || PAINTS[0];
