export type WorkspaceThemeId = 'teal' | 'indigo' | 'amber' | 'emerald' | 'rose' | 'cobalt';

export interface WorkspaceTheme {
  id: WorkspaceThemeId;
  accent: string;
  soft: string;
  border: string;
  ink: string;
  cssVars: string;
}

const PALETTES: ReadonlyArray<Omit<WorkspaceTheme, 'cssVars'>> = [
  { id: 'teal', accent: '#0f766e', soft: '#f0fdfa', border: '#99f6e4', ink: '#115e59' },
  { id: 'indigo', accent: '#3730a3', soft: '#eef2ff', border: '#c7d2fe', ink: '#312e81' },
  { id: 'amber', accent: '#b45309', soft: '#fffbeb', border: '#fde68a', ink: '#92400e' },
  { id: 'emerald', accent: '#15803d', soft: '#f0fdf4', border: '#bbf7d0', ink: '#166534' },
  { id: 'rose', accent: '#9f1239', soft: '#fff1f2', border: '#fecdd3', ink: '#881337' },
  { id: 'cobalt', accent: '#1d4ed8', soft: '#eff6ff', border: '#bfdbfe', ink: '#1e40af' },
];

const THEMES: ReadonlyArray<WorkspaceTheme> = PALETTES.map((p) => ({
  ...p,
  cssVars: `--ws-accent: ${p.accent}; --ws-accent-soft: ${p.soft}; --ws-accent-border: ${p.border}; --ws-accent-ink: ${p.ink};`,
}));

function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function getWorkspaceTheme(key: string): WorkspaceTheme {
  const normalized = (key || '').trim().toLowerCase();
  if (!normalized) {
    return THEMES[0];
  }
  const index = fnv1aHash(normalized) % THEMES.length;
  return THEMES[index];
}
