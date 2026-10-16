/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#FDFBF7',
          100: '#F9F6F0',
          150: '#F5F0E6',
          200: '#EFE8DA',
          300: '#E4D9C5',
          400: '#D5C7AF',
          500: '#BDB096',
        },
        espresso: {
          950: '#140E0A',
          900: '#1E150F',
          800: '#2E2017',
          700: '#453225',
          600: '#614937',
          500: '#7E6451',
          400: '#A18774',
          300: '#C7B4A3',
          200: '#E2D8CF',
        },
        denim: {
          50: '#EDF4FD',
          100: '#D6E3F7',
          200: '#ADC7F0',
          300: '#7DA4E0',
          400: '#5581CE',
          500: '#3B64B5',
          600: '#2E4F91',
          700: '#223D72',
          750: '#1D3461',
          800: '#182B50',
          850: '#132240',
          900: '#0F1A30', // Calça Jean Escura (Mais azul que preto)
          950: '#0B1324', // Indigo Raw Jeans profundo
        },
        gold: {
          50: '#FDFBF2',
          100: '#FAF4DB',
          200: '#F4E5A8',
          300: '#EED472',
          400: '#E4BF3C',
          500: '#D4A81E',
          600: '#B68B12',
          700: '#946F0C',
          800: '#735508',
          900: '#523C04',
        }
      },
      boxShadow: {
        'gold': '0 1px 3px 0 rgba(182, 139, 18, 0.2), 0 1px 2px -1px rgba(182, 139, 18, 0.1)',
        'gold-lg': '0 4px 12px -2px rgba(182, 139, 18, 0.25)',
        'warm': '0 1px 3px 0 rgba(30, 21, 15, 0.06), 0 1px 2px -1px rgba(30, 21, 15, 0.04)',
        'warm-lg': '0 6px 16px -3px rgba(30, 21, 15, 0.08)',
        'denim': '0 1px 3px 0 rgba(11, 19, 36, 0.35)',
        'denim-lg': '0 6px 16px -3px rgba(11, 19, 36, 0.5)',
      }
    },
  },
  plugins: [],
}
