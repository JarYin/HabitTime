/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // สีอ้างอิง CSS variables (กำหนดใน global.css) เพื่อให้สลับ light/dark ได้ runtime
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        surface2: 'rgb(var(--color-surface2) / <alpha-value>)',
        stroke: 'rgb(var(--color-stroke) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        primaryDeep: 'rgb(var(--color-primary-deep) / <alpha-value>)',
        primarySoft: 'rgb(var(--color-primary-soft) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        subtle: 'rgb(var(--color-subtle) / <alpha-value>)',
        track: 'rgb(var(--color-track) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        warn: 'rgb(var(--color-warn) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
