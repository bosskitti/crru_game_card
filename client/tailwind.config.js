/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        orbitron: ['Orbitron', 'sans-serif'],
      },
      colors: {
        cyber: {
          dark: '#060814',
          surface: '#0c0f1d',
          elevated: '#12162b',
          cyan: '#00f0ff',
          pink: '#ff0055',
          green: '#00ff66',
          yellow: '#ffe600',
        }
      }
    },
  },
  plugins: [],
}
