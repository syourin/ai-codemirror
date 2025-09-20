import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI推敲アシスト',
  description: 'CodeMirror と AI 推敲アシストのデモ'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
