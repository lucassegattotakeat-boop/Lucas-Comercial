import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Leads Perdidos — Inside Sales',
  description: 'Dashboard de leads perdidos do pipeline Inside Sales (HubSpot)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
