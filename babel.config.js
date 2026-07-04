module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    overrides: [
      {
        // จำกัดเฉพาะโค้ดของโปรเจกต์เอง (ไม่แตะ node_modules) กัน react-native ภายในพัง
        // เช่น Event.js ที่ใช้ static class field แบบ non-writable ของตัวเอง
        test: (fileName) => !!fileName && !fileName.includes('node_modules'),
        plugins: [
          // WatermelonDB models ใช้ decorators (@text, @field, ...) — ต้องเปิดโหมด legacy
          // legacy decorators ต้องรันก่อน class-properties เสมอ (ลำดับสำคัญ) และ loose ต้องตรงกัน
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-transform-class-properties', { loose: true }],
          ['@babel/plugin-transform-private-methods', { loose: true }],
          ['@babel/plugin-transform-private-property-in-object', { loose: true }],
        ],
      },
    ],
  };
};
