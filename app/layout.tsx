import ErrorBoundary from '@/components/ErrorBoundary';
import { RedirectHandler } from '@/components/misc/RedirectHandler';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { EchoProvider } from '@/providers/echo-provider';
import QueryClientProvider from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';

import './globals.css';

const inter = Poppins({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'SIGEAC',
  description: 'Sistema de Gestión Aeronáutica Civil',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="icon" href="/images/logo.png" sizes="any" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <QueryClientProvider>
          <ErrorBoundary>
            <RedirectHandler />
            <AuthProvider>
              <EchoProvider>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                  {children}
                  <Toaster />
                </ThemeProvider>
              </EchoProvider>
            </AuthProvider>
          </ErrorBoundary>
        </QueryClientProvider>
      </body>
    </html>
  );
}
