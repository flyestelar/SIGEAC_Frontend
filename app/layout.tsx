import ErrorBoundary from '@/components/ErrorBoundary';
import { RedirectHandler } from '@/components/misc/RedirectHandler';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { EchoProvider } from '@/providers/echo-provider';
import QueryClientProvider from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';

import { getCurrentUser } from '@/lib/auth/user';
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
  const user = await getCurrentUser();
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="icon" href="/images/logo.png" sizes="any" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <QueryClientProvider>
          <RedirectHandler />
          <AuthProvider user={user}>
            <EchoProvider>
              <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                <ErrorBoundary>{children}</ErrorBoundary>
                <Toaster />
              </ThemeProvider>
            </EchoProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
