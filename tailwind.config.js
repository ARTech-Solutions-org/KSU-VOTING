/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ksu: {
          green: {
            light: '#27b373',
            DEFAULT: '#248675',
            dark: '#1b6053',
          },
          teal: {
            light: '#2bb6a4',
            DEFAULT: '#215877',
            dark: '#183f55',
          },
          navy: {
            light: '#243e6c',
            DEFAULT: '#282560',
            dark: '#0d2745',
            deep: '#071628',
          },
          cyan: {
            DEFAULT: '#00f2fe',
            glow: '#00e5ff',
            neon: '#05ffd1',
          },
          gold: '#f59e0b',
          silver: '#94a3b8',
          bronze: '#d97706',
        }
      },
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'IBM Plex Sans Arabic', 'sans-serif'],
        condensed: ['"Barlow Condensed"', 'Oswald', 'sans-serif'],
        sans: ['Cairo', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.8', filter: 'drop-shadow(0 0 15px rgba(0, 242, 254, 0.6))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 30px rgba(0, 242, 254, 0.9))' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}

