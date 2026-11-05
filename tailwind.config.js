/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Tropical Contemporary oficial
        tropical: {
          ocean: {
            DEFAULT: '#087E83',
            50: '#F0F9FA',
            100: '#D5F0F2',
            200: '#ADE2E5',
            300: '#7DCFD4',
            400: '#3CB8BF',
            500: '#087E83',
            600: '#06676B',
            700: '#055255',
            800: '#033C3E',
            900: '#183C3D',
          },
          turquoise: {
            DEFAULT: '#55C6C0',
            50: '#F1FAF9',
            100: '#DCF4F2',
            200: '#BFECE8',
            300: '#94E0DB',
            400: '#70D5CF',
            500: '#55C6C0',
            600: '#3DA8A2',
            700: '#2F8580',
          },
          sand: {
            DEFAULT: '#F4E8D1',
            50: '#FCF9F3',
            100: '#FAF5EC',
            200: '#F4E8D1',
            300: '#ECCFA8',
            400: '#E4B77F',
            border: '#E8D5B5',
          },
          coral: {
            DEFAULT: '#FF806B',
            50: '#FFF5F3',
            100: '#FFE8E4',
            200: '#FFD1C9',
            300: '#FFAFA1',
            400: '#FF806B',
            500: '#FA5F45',
            600: '#DE3F25',
          },
          palm: {
            DEFAULT: '#477C59',
            50: '#F2F7F4',
            100: '#E0EDE4',
            200: '#C1DBC9',
            300: '#9BBEA5',
            400: '#6FA07E',
            500: '#477C59',
            600: '#376246',
          },
          text: {
            DEFAULT: '#183C3D',
            secondary: '#385758',
            muted: '#5F7C7D',
            light: '#91A7A8',
          },
          bg: {
            DEFAULT: '#FAF8F5',
            card: '#FFFFFF',
            subtle: '#F4EFE6',
          },
        },
        // Mapeamento de retrocompatibilidade harmonizado com a nova paleta
        coastal: {
          ocean: {
            DEFAULT: '#087E83',
            50: '#F0F9FA',
            100: '#D5F0F2',
            200: '#ADE2E5',
            500: '#087E83',
            600: '#06676B',
            700: '#055255',
            800: '#183C3D',
            900: '#0E2324',
          },
          water: {
            DEFAULT: '#55C6C0',
            light: '#DCF4F2',
            dark: '#3DA8A2',
          },
          sand: {
            DEFAULT: '#F4E8D1',
            light: '#FAF5EC',
            dark: '#ECCFA8',
            border: '#E8D5B5',
          },
          offwhite: {
            DEFAULT: '#FAF8F5',
            pure: '#FFFFFF',
            muted: '#F4EFE6',
          },
          coral: {
            DEFAULT: '#FF806B',
            light: '#FFE8E4',
            dark: '#DE3F25',
          },
          teal: {
            DEFAULT: '#087E83',
            light: '#55C6C0',
            dark: '#06676B',
          },
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'tropical-sm': '0 2px 8px -1px rgba(24, 60, 61, 0.06), 0 1px 3px -1px rgba(24, 60, 61, 0.04)',
        'tropical': '0 6px 20px -3px rgba(24, 60, 61, 0.08), 0 3px 8px -2px rgba(24, 60, 61, 0.04)',
        'tropical-lg': '0 12px 32px -4px rgba(24, 60, 61, 0.12), 0 4px 12px -2px rgba(24, 60, 61, 0.06)',
        'tropical-glow': '0 0 25px -3px rgba(85, 198, 192, 0.35)',
        'coastal': '0 6px 20px -3px rgba(24, 60, 61, 0.08), 0 3px 8px -2px rgba(24, 60, 61, 0.04)',
        'coastal-hover': '0 12px 30px -4px rgba(24, 60, 61, 0.14), 0 4px 12px -2px rgba(24, 60, 61, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float-slow': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}
