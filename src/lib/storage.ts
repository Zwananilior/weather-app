
export type Units = 'metric' | 'imperial';
export type Theme = 'dark' | 'light';

const KEYS = {
  locations: 'rw.locations',
  theme: 'rw.theme',
  units: 'rw.units'
};

export function loadUnits(): Units {
  const v = localStorage.getItem(KEYS.units);
  return (v === 'imperial' || v === 'metric') ? v : 'metric';
}
export function saveUnits(u: Units) {
  localStorage.setItem(KEYS.units, u);
}

export function loadTheme(): Theme {
  const v = localStorage.getItem(KEYS.theme);
  return (v === 'light' || v === 'dark') ? v : 'dark';
}
export function saveTheme(t: Theme) {
  localStorage.setItem(KEYS.theme, t);
}

export function loadLocations(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.locations) || '[]');
  } catch { return []; }
}
export function saveLocations(list: string[]) {
  localStorage.setItem(KEYS.locations, JSON.stringify(list));
}
