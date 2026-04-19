export const colors = {
  background: '#0D1B2A',
  surface: '#1B2838',
  card: '#1E3A5F',
  primary: '#00D4AA',
  accent: '#FFD700',
  danger: '#FF4757',
  success: '#2ED573',
  warning: '#FFA502',
  text: '#FFFFFF',
  textSecondary: '#8892A4',
  border: '#1E3A5F',
  overlay: 'rgba(0,0,0,0.6)',
} as const;

export const typography = {
  fontSizeXS: 11,
  fontSizeSM: 13,
  fontSizeMD: 15,
  fontSizeLG: 18,
  fontSizeXL: 22,
  fontSizeXXL: 28,
  fontSizeHero: 36,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radii = {
  small: 8,
  medium: 12,
  large: 16,
  xl: 24,
  round: 50,
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  radii,
} as const;

export type Theme = typeof theme;

