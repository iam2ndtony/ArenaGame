import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MarxArena - Đấu Trường Trắc Nghiệm Mác - Lênin',
  description: 'Trò chơi đấu trường quiz nhiều người chơi thời gian thực. Quét QR vào phòng tức thì, tranh tài kiến thức Mác - Lênin, mở rương bí mật và cướp điểm kịch tính!',
  keywords: ['Mác Lênin', 'Triết học Mác Lênin', 'MLN131', 'Quiz nhiều người chơi', 'Blooket style', 'MarxArena'],
  authors: [{ name: 'MarxArena Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⭐</text></svg>" />
      </head>
      <body>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
