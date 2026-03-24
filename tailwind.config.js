/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        wall: {
          bg: '#faf9f7',
          surface: '#f3f1ee',
          border: '#e8e4df',
          text: '#2d2a26',
          muted: '#8a8580',
          overdue: '#e05a4a',
          'overdue-bg': '#fdf0ee',
          today: '#2a8f82',
          'today-bg': '#eef8f6',
          upcoming: '#8a8580',
          'upcoming-bg': '#f7f5f3',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out both',
        'pop-in': 'pop-in 0.4s ease-out both',
        float: 'float 3s ease-in-out infinite',
        heartbeat: 'heartbeat 1.8s ease-in-out infinite',
        stare: 'stare 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
