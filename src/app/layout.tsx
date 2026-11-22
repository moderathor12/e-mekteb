import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'T-Şkala — Məktəb Qiymətləndirmə Portalı',
  description: 'T-Şkala formativ qiymətləndirmə jurnalı və valideyn məlumatlandırma platforması',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="az">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {children}
      </body>
    </html>
  );
}
