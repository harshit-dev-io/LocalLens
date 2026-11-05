/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          950: '#0A0A09',
          900: '#0D0D0C',
          850: '#121110',
          800: '#171615',
          750: '#1D1B1A',
          700: '#262422',
          600: '#3A3734',
          500: '#57534E',
          400: '#78716C',
          300: '#A8A29E',
          200: '#D6D3D1',
          100: '#E7E5E4',
          50: '#FAF7F2',
        },
        terracotta: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        amber: {
          450: '#F59E0B',
          550: '#D97706',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glass-warm': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'glow-terracotta': '0 0 35px -5px rgba(234, 88, 12, 0.3)',
        'glow-amber': '0 0 25px -5px rgba(217, 119, 6, 0.25)',
      },
      animation: {
        'soundwave': 'soundwave 1s ease-in-out infinite alternate',
      },
      keyframes: {
        soundwave: {
          '0%': { height: '4px' },
          '100%': { height: '22px' },
        }
      }
    },
  },
  plugins: [],
}
