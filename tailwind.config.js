/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1a1a1a',
        parchment: '#f5f1e8',
        gold: '#c9a86a',
        sepia: '#704214',
        muted: '#8b8378',
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        display: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
