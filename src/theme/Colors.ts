// theme/Colors.ts
// theme/Colors.ts
export const Colors = {
  /* ===== Core Brand (Muted Premium Green) ===== */
  primary: '#1F7A68',          
  primaryLight: '#4FA89A',
  primaryLighter: '#E6F3F0',
  primaryDark: '#145E50',
  primaryDarker: '#0F4A3F',

  /* ===== Green Density (NEW – very important) ===== */
  greenLow: '#EAF5F2',         // subtle background tint (cards, rows)
  greenMid: '#BFE4DB',         // soft highlight / selection
  greenHigh: '#2F8F7D',        // emphasis without shouting

  /* ===== Accent / Ink Blue ===== */
  secondary: '#2E3A59',
  secondaryLight: '#55607A',
  secondaryLighter: '#E9ECF1',
  secondaryDark: '#1F293D',
  secondaryDarker: '#161E2E',

  /* ===== Stock Status (kept intact) ===== */
  stockOk: '#6B7280',
  stockLow: '#C7923E',
  stockOut: '#9B6A6A',

  /* ===== Backgrounds ===== */
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F3F6',

  /* ===== Text ===== */
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textLight: '#9CA3AF',
  textInverse: '#FFFFFF',

  /* ===== Borders ===== */
  border: '#E1E4E8',
  borderLight: '#EEF0F3',

  /* ===== Status ===== */
  success: '#1F7A68',
  successLight: '#4FA89A',

  warning: '#B7791F',
  warningLight: '#E3B341',

  error: '#B4534B',
  errorLight: '#E5A3A0',

  info: '#2E3A59',
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
    semibold: '600' as '600',
    bold: '700' as '700',
  
  }
};

export const BorderRadius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
};

export const Gradients = {
  primary: ['#1F7A68', '#4FA89A'],
  greenSoft: ['#EAF5F2', '#FFFFFF'],
  inkFade: ['#2E3A59', '#55607A'],
};

export const Motion = {
  fast: 120,
  normal: 180,
  slow: 240,

  easing: {
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
  },
};

export const Elevation = {
  none: 0,
  sm: 1,
  md: 3,
  lg: 6,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
};


// For zoom functionality
export const getScaledFontSize = (size:number, scale:number=1) => {
  if (scale < 1) return size * (0.9 + scale * 0.1); 
  if (scale > 1.3) return size * 1.25;             
  return size * scale;
}

// export const getScaledFontSize = (baseSize: number, scale: number = 1) => {
//   return baseSize * scale;
// };