// theme/Colors.ts
export const Colors = {
  // Green Theme
  primary: '#10B981',
  primaryLight: '#34D399',
  primaryLighter: '#D1FAE5',
  primaryDark: '#059669',
  primaryDarker: '#047857',
  
  secondary: '#3B82F6',
  secondaryLight: '#60A5FA',
  secondaryLighter: '#DBEAFE',
  secondaryDark: '#2563EB',
  secondaryDarker: '#1D4ED8',

  
  // Inventory specific
  stockGood: '#3B82F6',      // Blue for good stock
  stockLow: '#EF4444',       // Red for low stock
  stockOut: '#DC2626',       // Darker red for out of stock
  stockUntracked: '#6B7280', // Grey for no tracking
  
  // Backgrounds
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F4F6',
  
  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Status
  success: '#10B981',
  successLight: '#34D399',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#FCA5A5',
  info: '#3B82F6',
  infoLight: '#60A5FA',
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