import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MarxArena - Đấu Trường Trắc Nghiệm Tôn Giáo & Dân Tộc',
  description: 'Trò chơi đấu trường trắc nghiệm nhiều người chơi thời gian thực. Quét QR vào phòng tức thì, tranh tài kiến thức, mở rương bí mật và cướp điểm kịch tính!',
  keywords: ['Trắc nghiệm tôn giáo', 'Chính sách tôn giáo', 'Quan hệ dân tộc tôn giáo', 'Quiz nhiều người chơi', 'Blooket style', 'MarxArena'],
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
        <div
          id="app-fixed-bg"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/background.jpg?v=2)',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
        <main className="min-h-screen" style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
