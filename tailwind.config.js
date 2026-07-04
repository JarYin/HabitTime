/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // ธีมมืด + ชมพูอ้างอิงจากโทนสีในเอกสาร UML ของ HabitTime 2.0
      colors: {
        background: '#0B0B10',
        surface: '#15151C',
        surface2: '#1E1E27',
        stroke: '#262632',
        primary: '#EC4899',
        primarySoft: '#3D1230',
        ink: '#F4F4F6',
        muted: '#9CA3AF',
        success: '#34D399',
        danger: '#F87171',
        warn: '#FBBF24',
      },
    },
  },
  plugins: [],
};
