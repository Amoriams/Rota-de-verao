/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coastal: {
          ocean: {
            DEFAULT: '#164E63',
            50: '#F0F9FB',
            100: '#D5F0F5',
            200: '#A9E0EB',
            500: '#164E63',
            600: '#0F3B4C',
            700: '#0A2A37',
            800: '#061D27',
            900: '#031118',
          },
          water: {
            DEFAULT: '#67C5D4',
            light: '#A2E0EB',
            dark: '#4BAAB9',
          },
          sand: {
            DEFAULT: '#E9D9BD',
            light: '#F5EFE3',
            dark: '#D5BE99',
            border: '#E2CEAE',
          },
          offwhite: {
            DEFAULT: '#FFFDF7',
            pure: '#FFFFFF',
            muted: '#F9F7F1',
          },
          coral: {
            DEFAULT: '#EF936F',
            light: '#F8BEA7',
            dark: '#D8714B',
          },
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'coastal': '0 4px 20px -2px rgba(22, 78, 99, 0.08), 0 2px 6px -1px rgba(22, 78, 99, 0.04)',
        'coastal-hover': '0 10px 25px -3px rgba(22, 78, 99, 0.12), 0 4px 10px -2px rgba(22, 78, 99, 0.06)',
      },
    },
  },
  plugins: [],
}
