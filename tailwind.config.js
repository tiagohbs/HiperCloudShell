/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
        'gold': '0 4px 14px 0 rgba(212, 168, 30, 0.35)',
        'gold-lg': '0 8px 24px 0 rgba(212, 168, 30, 0.45)',
        'warm': '0 4px 20px -2px rgba(30, 21, 15, 0.08)',
        'warm-lg': '0 10px 30px -4px rgba(30, 21, 15, 0.12)',
      }
    },
  },
  plugins: [],
}
