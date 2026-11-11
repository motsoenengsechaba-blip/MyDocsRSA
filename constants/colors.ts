// MyDocs RSA design tokens.
// Midnight navy (authority), emerald (verified), gold (the official seal) on a cool paper background.
// Key names are unchanged from the original file, so every screen picks up the look automatically.
export const colors = {
  primary: '#0B6B4F', // emerald: verified, trusted, "go"
  primaryDark: '#084C38',
  primarySoft: '#DDF3E9',
  primaryText: '#FFFFFF',

  navy: '#0A1F44', // headers and the sign-in hero
  navyMid: '#123A63',
  gold: '#C9A24B', // the seal; use sparingly
  goldSoft: '#F6ECD2',

  background: '#F2F4F3',
  card: '#FFFFFF',
  cardTint: '#EAF2EE',
  border: '#E1E6E3',

  text: '#0D1B2A',
  muted: '#5A6B78',
  faint: '#97A4AE',

  danger: '#B42318',
  dangerBg: '#FDE8E6',
  dangerBorder: '#F2A29A',
  success: '#0B6B4F',
  successBg: '#DDF3E9',
  warn: '#9A6700',
  warnBg: '#FBF0D0',
  info: '#1D4E89',
  infoBg: '#DCE8F6',
};

export const radius = { sm: 12, md: 16, lg: 24 };

/** Soft shadow used on cards (elevation covers Android, boxShadow the rest). */
export const cardShadow = {
  boxShadow: '0 6px 20px rgba(10, 31, 68, 0.07)',
  elevation: 2,
} as const;
