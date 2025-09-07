/**
 * BrainSAIT Digital Insurance Platform - Design System
 * 
 * Brand colors, typography, and design tokens for consistent UI/UX
 * Includes glassmorphism effects and mesh gradients
 */

// BrainSAIT Primary Brand Colors
export const brandColors = {
  // Primary palette - Deep blues and teals
  primary: {
    50: '#e6f7ff',
    100: '#bae7ff',
    200: '#91d5ff',
    300: '#69c0ff',
    400: '#40a9ff',
    500: '#1890ff', // Primary brand blue
    600: '#096dd9',
    700: '#0050b3',
    800: '#003a8c',
    900: '#002766'
  },
  
  // Secondary palette - Elegant purples
  secondary: {
    50: '#f9f0ff',
    100: '#efdbff',
    200: '#d3adf7',
    300: '#b37feb',
    400: '#9254de',
    500: '#722ed1', // Secondary brand purple
    600: '#531dab',
    700: '#391085',
    800: '#22075e',
    900: '#120338'
  },
  
  // Accent palette - Modern teals
  accent: {
    50: '#e6fffb',
    100: '#b5f5ec',
    200: '#87e8de',
    300: '#5cdbd3',
    400: '#36cfc9',
    500: '#13c2c2', // Accent teal
    600: '#08979c',
    700: '#006d75',
    800: '#00474f',
    900: '#002329'
  },
  
  // Status colors for healthcare context
  success: '#52c41a',
  warning: '#faad14',
  error: '#f5222d',
  info: '#1890ff',
  
  // Healthcare specific colors
  medical: {
    emergency: '#ff4d4f',
    urgent: '#fa8c16',
    normal: '#52c41a',
    routine: '#1890ff'
  }
};

// Mesh gradient configurations
export const meshGradients = {
  primary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    animated: `
      background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c);
      background-size: 400% 400%;
      animation: gradientShift 15s ease infinite;
    `
  },
  
  secondary: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    animated: `
      background: linear-gradient(-45deg, #f093fb, #f5576c, #4facfe, #00f2fe);
      background-size: 400% 400%;
      animation: gradientShift 12s ease infinite;
    `
  },
  
  healthcare: {
    background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    medical: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    insurance: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)'
  },
  
  glass: {
    light: `
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.18);
    `,
    dark: `
      background: rgba(0, 0, 0, 0.25);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.18);
    `,
    colored: `
      background: rgba(24, 144, 255, 0.25);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(24, 144, 255, 0.18);
    `
  }
};

// Typography system
export const typography = {
  fontFamily: {
    primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    arabic: '"IBM Plex Sans Arabic", "Segoe UI", sans-serif',
    monospace: '"Fira Code", "SF Mono", Monaco, Consolas, monospace'
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
  
  fontWeight: {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900
  },
  
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2
  }
};

// Spacing system (8px base unit)
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem'     // 256px
};

// Border radius for modern look
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px'
};

// Shadows for glassmorphism
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Glassmorphism specific shadows
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  glassHover: '0 8px 32px 0 rgba(31, 38, 135, 0.5)',
  glassFocus: '0 0 0 3px rgba(24, 144, 255, 0.3)'
};

// Animation and transitions
export const animations = {
  transition: {
    fast: '150ms ease',
    base: '250ms ease',
    slow: '350ms ease'
  },
  
  keyframes: {
    gradientShift: `
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `,
    
    fadeIn: `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `,
    
    slideIn: `
      @keyframes slideIn {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
    `,
    
    pulse: `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `
  }
};

// Component themes
export const componentThemes = {
  button: {
    primary: {
      background: meshGradients.primary.background,
      color: 'white',
      hover: {
        transform: 'translateY(-2px)',
        boxShadow: shadows.lg
      }
    },
    glass: {
      background: meshGradients.glass.colored,
      backdropFilter: 'blur(15px)',
      border: '1px solid rgba(24, 144, 255, 0.18)',
      color: brandColors.primary[600]
    }
  },
  
  card: {
    glass: {
      background: meshGradients.glass.light,
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
      borderRadius: borderRadius['2xl'],
      boxShadow: shadows.glass
    },
    medical: {
      background: meshGradients.healthcare.medical,
      border: `1px solid ${brandColors.medical.normal}`,
      borderRadius: borderRadius.lg
    }
  },
  
  dashboard: {
    background: meshGradients.healthcare.background,
    sidebar: meshGradients.glass.dark,
    header: meshGradients.glass.light
  }
};

// Responsive breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Z-index scale
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800
};

// Export complete design system
export const designSystem = {
  colors: brandColors,
  gradients: meshGradients,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  components: componentThemes,
  breakpoints,
  zIndex
};

export default designSystem;