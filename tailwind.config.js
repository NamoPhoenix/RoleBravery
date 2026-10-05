/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hextech: {
          dark: '#010a13',
          card: '#091428',
          cardLight: '#0f1f38',
          border: '#1e3a5f',
          gold: '#c8aa6e',
          goldLight: '#f0e6d2',
          goldDark: '#785a28',
          blue: '#0ac8b9',
          blueGlow: '#005a82',
        },
        team: {
          blue: {
            DEFAULT: '#0284c7',
            light: '#38bdf8',
            dark: '#0369a1',
            glow: 'rgba(56, 189, 248, 0.4)',
            bg: 'rgba(2, 132, 199, 0.08)',
            border: '#0284c7'
          },
          red: {
            DEFAULT: '#e11d48',
            light: '#fb7185',
            dark: '#be123c',
            glow: 'rgba(251, 113, 133, 0.4)',
            bg: 'rgba(225, 29, 72, 0.08)',
            border: '#e11d48'
          }
        }
      },
      fontFamily: {
        sans: ['Oxanium', 'Rajdhani', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Oxanium', 'Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
