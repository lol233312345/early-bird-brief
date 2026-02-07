import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: '早起的鸟儿有虫吃',
  description: '每日晨报速览与全文阅读'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <div className="brand">早起的鸟儿有虫吃</div>
            <div className="tagline">每日 08:00 更新 · 只读展示</div>
          </header>
          <main className="app-main">{children}</main>
          <footer className="app-footer">本应用仅展示自动化生成的晨报内容</footer>
        </div>
      </body>
    </html>
  );
}
