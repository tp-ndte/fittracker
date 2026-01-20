/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Vibrant Blue
        primary: {
          50: '#e6ebf5',
          100: '#ccd7eb',
          200: '#99afd7',
          300: '#6687c3',
          400: '#335faf',
          500: '#00308F', // Main primary
          600: '#002a7a',
          700: '#002366',
          800: '#001d52',
          900: '#00163d',
        },
        // Secondary - Soft Blue
        secondary: {
          50: '#f0f5fa',
          100: '#e1ebf5',
          200: '#c3d7eb',
          300: '#a5c3e1',
          400: '#7EA3CC', // Main secondary
          500: '#6690bf',
          600: '#527db2',
          700: '#3d6a9f',
          800: '#2d578c',
          900: '#1e4479',
        },
        // Success - Fresh Green
        success: {
          50: '#e8f0ef',
          100: '#d1e1df',
          200: '#a3c3bf',
          300: '#75a59f',
          400: '#47877f',
          500: '#357266', // Main success
          600: '#2d6258',
          700: '#25524a',
          800: '#1d423c',
          900: '#15322e',
        },
        // Red/coral for strength tags
        strength: {
          50: '#fff0f0',
          100: '#ffe1e2',
          200: '#ffc3c5',
          300: '#ffa5a8',
          400: '#FF595E', // Main strength red
          500: '#FF595E',
          600: '#e64d52',
          700: '#cc4146',
          800: '#b3353a',
          900: '#99292e',
        },
        // Yellow/amber for mobility tags
        mobility: {
          50: '#fff9eb',
          100: '#fff3d7',
          200: '#ffe7af',
          300: '#ffdb87',
          400: '#FFBC42', // Main mobility yellow
          500: '#FFBC42',
          600: '#e6a63b',
          700: '#cc9034',
          800: '#b37a2d',
          900: '#996426',
        },
        // Neutral grays
        surface: {
          50: '#F9FAFB', // Background
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280', // Secondary text
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937', // Primary text
          900: '#111827',
        }
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.12)',
        'button': '0 2px 4px rgba(0, 48, 143, 0.15)',
        'button-hover': '0 4px 8px rgba(0, 48, 143, 0.25)',
        'nav': '0 -4px 12px rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
