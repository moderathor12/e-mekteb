import type { Metadata } from 'next';
import './globals.css';
import { APP_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} — ${APP_CONFIG.tagline}`,
  description: 'Formativ qiymətləndirmə jurnalı və valideyn məlumatlandırma platforması',
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
