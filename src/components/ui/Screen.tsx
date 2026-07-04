import type { PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps extends PropsWithChildren {
  className?: string;
  /** ปิด safe area ด้านล่าง (สำหรับหน้าที่อยู่ใน tab bar) */
  noBottomInset?: boolean;
}

/** พื้นหลัง + safe area มาตรฐานของทุกหน้าจอ */
export default function Screen({ children, className, noBottomInset }: ScreenProps) {
  return (
    <SafeAreaView
      edges={noBottomInset ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}
      className={`flex-1 bg-background ${className ?? ''}`}
    >
      {children}
    </SafeAreaView>
  );
}
