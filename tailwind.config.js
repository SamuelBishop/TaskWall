/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        wall: {
          bg: '#08001a',
          surface: '#14002e',
          border: '#6d1b7b',
          text: '#f0e0ff',
          muted: '#b088cc',
          overdue: '#ff1155',
          'overdue-bg': '#2a0018',
          today: '#ff6eb4',
          'today-bg': '#1a0030',
          upcoming: '#9d4edd',
          'upcoming-bg': '#100022',
        },
      },
      fontFamily: {
        sans: ['"M PLUS Rounded 1c"', 'Nunito', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        wobble: {
          '0%, 100%': { transform: 'rotate(-1deg) translateX(-1px)' },
          '25%': { transform: 'rotate(1.5deg) translateX(2px)' },
          '50%': { transform: 'rotate(-1deg) translateX(-2px)' },
          '75%': { transform: 'rotate(0.5deg) translateX(1px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
          '75%': { opacity: '0.85' },
        },
        rainbow: {
          '0%':   { color: '#ff6eb4' },
          '25%':  { color: '#9d4edd' },
          '50%':  { color: '#ff1155' },
          '75%':  { color: '#c084fc' },
          '100%': { color: '#ff6eb4' },
        },
        glow: {
          '0%, 100%': { 'box-shadow': '0 0 6px 1px #ff115540' },
          '50%': { 'box-shadow': '0 0 18px 5px #ff115570' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.2)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.1)' },
          '70%': { transform: 'scale(1)' },
        },
        stare: {
          '0%, 90%, 100%': { transform: 'scale(1)' },
          '95%': { transform: 'scale(1.05)' },
        },
      },
      animation: {
        wobble: 'wobble 0.7s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        flicker: 'flicker 3s ease-in-out infinite',
        rainbow: 'rainbow 5s linear infinite',
        glow: 'glow 2.5s ease-in-out infinite',
        heartbeat: 'heartbeat 1.8s ease-in-out infinite',
        stare: 'stare 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
