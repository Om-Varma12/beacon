/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F7F7F5',
        forest: '#1A3C2B',
        grid: '#3A3A38',
        coral: '#FF8C69',
        mint: '#9EFFBF',
        gold: '#F4D35E',
      },
      fontFamily: {
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
        'general-sans': ['General Sans', 'sans-serif'],
        jetbrains: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}