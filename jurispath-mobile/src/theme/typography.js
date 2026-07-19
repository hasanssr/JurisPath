/**
 * JurisPath Typography System
 * 
 * Inter for UI elements, system serif for legal document reading.
 * Readable during long legal sessions.
 */

export const typography = {
  family: {
    sans: 'Inter',
    sansFallback: 'System',
    mono: 'JetBrainsMono',
  },

  size: {
    xs:   11,
    sm:   12,
    base: 14,
    md:   15,
    lg:   16,
    xl:   18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 30,
    '5xl': 36,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.65,
    loose: 1.8,
  },

  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Pre-built text styles
  styles: {
    // Display
    displayLg: {
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 38,
      letterSpacing: -0.5,
    },
    displayMd: {
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 32,
      letterSpacing: -0.3,
    },
    displaySm: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
      letterSpacing: -0.2,
    },

    // Headings
    h1: {
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 32,
      letterSpacing: -0.3,
    },
    h2: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
      letterSpacing: -0.2,
    },
    h3: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 26,
    },
    h4: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
    },

    // Body
    bodyLg: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 26,
    },
    bodyMd: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 24,
    },
    body: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 22,
    },
    bodySm: {
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 20,
    },

    // Labels
    labelLg: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
    },
    label: {
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 18,
    },
    labelSm: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 16,
    },

    // Caption / Meta
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
    overline: {
      fontSize: 11,
      fontWeight: '600',
      lineHeight: 14,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
  },
};
