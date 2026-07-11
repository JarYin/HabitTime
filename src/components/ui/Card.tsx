import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

interface CardProps extends PropsWithChildren {
  className?: string;
}

/** การ์ดขาวมุมมนพร้อมเงานุ่ม ๆ — คอนเทนเนอร์มาตรฐานบนพื้นครีม */
export default function Card({ children, className }: CardProps) {
  return (
    <View
      className={`rounded-2xl bg-surface ${className ?? ''}`}
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      {children}
    </View>
  );
}
