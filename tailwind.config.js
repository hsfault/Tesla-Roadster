/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    screens: { sm: '480px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1600px' },
    extend: {
      colors: {
        night: '#050507',
        asphalt: '#0F1012',
        rig: '#1C1E22',
        steel: '#8A929C',
        mist: '#C9CED6',
        white: '#F3F5F7',
        led: '#FF2A2A',
        ledDeep: '#C8161B',
        smoke: '#DADDE0',
      },
      fontFamily: {
        display: ['Michroma', 'Geist', 'system-ui', 'sans-serif'],
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        hero: ['clamp(4rem, 14vw, 14rem)', { lineHeight: '0.9' }],
        section: ['clamp(2rem, 5vw, 5rem)', { lineHeight: '1.02' }],
      },
      letterSpacing: { display: '0.02em', label: '0.14em' },
      transitionTimingFunction: { expo: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    },
  },
  plugins: [],
};
