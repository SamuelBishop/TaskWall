/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        wall: {
          bg: '#ffffff',
          surface: '#f5f5f5',
          border: '#e5e5e5',
          text: '#1a1a1a',
          muted: '#6b7280',
          overdue: '#dc2626',
          'overdue-bg': '#fef2f2',
          today: '#2563eb',
          'today-bg': '#eff6ff',
          upcoming: '#6b7280',
          'upcoming-bg': '#f9fafb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
