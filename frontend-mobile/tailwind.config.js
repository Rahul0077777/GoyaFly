/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5fb',
          100: '#dce8f5',
          500: '#1D4171',
          600: '#17365e',
          700: '#132c4d',
        },
        secondary: {
          50: '#fff6ef',
          100: '#ffeadd',
          500: '#F07E21',
          600: '#d96c13',
          700: '#b3560c',
        },
        accent: {
          50: '#eef8fc',
          100: '#d9eff9',
          500: '#48A0D4',
          600: '#328dbf',
          700: '#277199',
        }
      }
    },
  },
  plugins: [],
}
