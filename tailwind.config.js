/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'game-dark': '#0a0a0a',
        'game-wrapper': '#1a1a2e',
        'game-canvas': '#1a1a32',
        'game-blue': '#00aaff',
        'game-gold': '#ffdd57',
        'game-cyan': '#88ddff',
        'game-pink': '#ff9ff3',
        'game-red': '#ff6b6b',
        'game-green': '#7bed9f',
      },
      fontFamily: {
        'game': ['Segoe UI', 'Tahoma', 'sans-serif'],
      },
    },
  },
  plugins: [],
}