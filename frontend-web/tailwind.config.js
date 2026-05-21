/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        xs: '375px',
      },
      colors: {
        primary: {
          50: '#f0f5fb',
          100: '#dce8f5',
          500: '#1D4171', // Deep Blue
          600: '#17365e',
          700: '#132c4d',
        },
        secondary: {
          50: '#fff6ef',
          100: '#ffeadd',
          500: '#F07E21', // Bright Orange
          600: '#d96c13',
          700: '#b3560c',
        },
        accent: {
          50: '#eef8fc',
          100: '#d9eff9',
          500: '#48A0D4', // Sky Blue
          600: '#328dbf',
          700: '#277199',
        },
        black: '#000000'
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
