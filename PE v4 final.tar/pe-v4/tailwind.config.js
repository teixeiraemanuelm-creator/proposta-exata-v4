export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"','system-ui','sans-serif'] },
      colors: {
        brand: { 500:'#f97316',600:'#ea6c0a',700:'#c2410c' },
        dark: { 900:'#0f0e17',800:'#1a1829',700:'#252336',600:'#312f4a',500:'#3d3b5e' }
      }
    }
  },
  plugins: []
}
