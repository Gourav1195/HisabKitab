// theme/Colors.ts
export const Colors = {
  /* ===== Core Brand (Muted Premium Green) ===== */
  primary: '#1F7A68',          // deep jade green
  primaryLight: '#4FA89A',
  primaryLighter: '#E6F3F0',
  primaryDark: '#145E50',
  primaryDarker: '#0F4A3F',

  /* ===== Accent / Ink Blue (for Khata, links, history) ===== */
  secondary: '#2E3A59',        // ink navy
  secondaryLight: '#55607A',
  secondaryLighter: '#E9ECF1',
  secondaryDark: '#1F293D',
  secondaryDarker: '#161E2E',

  /* ===== Stock Status (UNCHANGED – you were right) ===== */
  stockOk: '#6B7280',
  stockLow: '#C7923E',
  stockOut: '#9B6A6A',

  /* ===== Backgrounds (Paper-like) ===== */
  background: '#F7F8FA',       // soft off-white
  surface: '#FFFFFF',
  surfaceAlt: '#F1F3F6',

  /* ===== Text (Readable, serious) ===== */
  textPrimary: '#111827',      // almost black
  textSecondary: '#4B5563',    // darker gray than before
  textLight: '#9CA3AF',
  textInverse: '#FFFFFF',

  /* ===== Borders ===== */
  border: '#E1E4E8',
  borderLight: '#EEF0F3',

  /* ===== Status (Muted, non-alarming) ===== */
  success: '#1F7A68',          // same as primary
  successLight: '#4FA89A',

  warning: '#B7791F',          // deeper amber, less yellow
  warningLight: '#E3B341',

  error: '#B4534B',            // muted brick red
  errorLight: '#E5A3A0',

  info: '#2E3A59',             // ink blue
  infoLight: '#55607A',
};

export const Spacing = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
};

export const Typography = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    bold: 'Inter-Bold',
  },

  fontSize: {
    xs: 11,
    sm: 13,
    md: 14,
    lg: 15,
    xl: 17,
    xxl: 20,
    xxxl: 24,
  },

  fontWeight: {
    regular: '400' as '400',
    medium: '500' as '500',
    bold: '700' as '700',
  
  }
};

export const BorderRadius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
};

// For zoom functionality
export const getScaledFontSize = (baseSize: number, scale: number = 1) => {
  return baseSize * scale;
};