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
      backgroundImage: {
        'mosaic': "url(\"data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='200' height='200' fill='%23F7F7F5' stroke='%233A3A38' stroke-width='0.5' stroke-opacity='0.15'/%3E%3Crect x='200' width='200' height='100' fill='%23F7F7F5' stroke='%233A3A38' stroke-width='0.5' stroke-opacity='0.15'/%3E%3Crect x='200' y='100' width='100' height='100' fill='%23F7F7F5' stroke='%233A3A38' stroke-width='0.5' stroke-opacity='0.15'/%3E%3Crect x='300' y='100' width='100' height='300' fill='%23F7F7F5' stroke='%233A3A38' stroke-width='0.5' stroke-opacity='0.15'/%3E%3Crect y='200' width='300' height='200' fill='%23F7F7F5' stroke='%233A3A38' stroke-width='0.5' stroke-opacity='0.15'/%3E%3C/svg%3E\")",
      },
    },
  },
}