/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#07080f',
          card: 'rgba(18, 19, 31, 0.65)',
          border: 'rgba(255, 255, 255, 0.08)',
          primary: '#8b5cf6', // neon purple
          secondary: '#06b6d4', // neon cyan
          accent: '#ec4899', // neon pink
          success: '#10b981', // emerald
          warning: '#f59e0b', // amber
          danger: '#f43f5e', // rose
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s infinite ease-in-out',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.3), 0 0 15px rgba(6, 182, 212, 0.2)' },
          '50%': { boxShadow: '0 0 15px rgba(139, 92, 246, 0.6), 0 0 30px rgba(6, 182, 212, 0.4)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
