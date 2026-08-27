/**
 * Dynamic app config — Expo อ่าน app.json ก่อน แล้วส่งผลลัพธ์เข้ามาเป็น `config`
 * ที่นี่จึงเป็นแค่ชั้นบาง ๆ ที่เติมค่าซึ่งรู้ได้เฉพาะตอน build เท่านั้น
 * (ค่าคงที่ทั้งหมดยังอยู่ใน app.json เหมือนเดิม — ไม่ต้องแก้สองที่)
 *
 * ทำไมต้องผ่าน `extra` ไม่ใช่ EXPO_PUBLIC_*:
 *   บิลด์ APK นั้น Metro รันบนเซิร์ฟเวอร์ของ EAS ไม่ใช่บน GitHub runner ค่า env
 *   ที่ตั้งไว้ใน workflow จึงส่งไปไม่ถึงตอน bundle — ต้องอาศัยตัวแปรที่ EAS ตั้งให้เอง
 *   บนเครื่อง build (EAS_BUILD_GIT_COMMIT_HASH) แล้วอ่านกลับด้วย expo-constants
 */
module.exports = ({ config }) => ({
  ...config,

  experiments: {
    ...config.experiments,
    // GitHub Pages เสิร์ฟที่ /<repo> ไม่ใช่ root — ถ้าไม่ตั้ง asset จะ 404 ทั้งหน้า
    // ตั้งเฉพาะตอน export เว็บใน CI เท่านั้น ฝั่ง native/dev ต้องไม่มีค่านี้
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },

  extra: {
    ...config.extra,
    /**
     * commit ที่ build นี้สร้างมาจาก — ใช้เทียบว่า APK กับเว็บพรีวิวเป็นเวอร์ชันเดียวกันไหม
     * - EAS_BUILD_GIT_COMMIT_HASH: EAS ตั้งให้เองบนเครื่อง build (ฝั่ง APK)
     * - GITHUB_SHA: GitHub Actions ตั้งให้บน runner (ฝั่ง web export)
     * - 'dev': รันในเครื่องตอนพัฒนา
     */
    commitSha: process.env.EAS_BUILD_GIT_COMMIT_HASH ?? process.env.GITHUB_SHA ?? 'dev',
  },
});
