/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        brand:  { DEFAULT: '#936868', light: '#C79F97', lighter: '#E5C9C9' },
        sand:   '#C79F97',
        shell:  '#E5C9C9',
      },
      boxShadow: {
        brand:    '0 4px 24px rgba(147, 104, 104, 0.20)',
        'brand-lg':'0 8px 40px rgba(147, 104, 104, 0.30)',
      },
      backgroundColor: {
        card: 'rgba(147, 104, 104, 0.07)',
      },
    },
  },
  plugins: [],
}
