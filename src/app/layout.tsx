
import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/header'; // Corrected import path
import { Footer } from '@/components/footer'; // Corrected import path
import { AuthProvider } from '@/hooks/useAuth'; // Import the Firebase AuthProvider
import { ScrollToTop } from '@/components/scroll-to-top';
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Qatrah Hayat - Blood Donation Platform',
  description: 'Connecting blood donors with those in need.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased flex flex-col",
          inter.variable
        )}
      >
         <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
         >
            <AuthProvider> {/* Wrap the application with Firebase AuthProvider */}
              <Header />
              <main className="flex-grow pt-4 pb-8 px-4 md:px-6 lg:px-8">
                {children}
              </main>
              <Footer />
              <ScrollToTop />
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
