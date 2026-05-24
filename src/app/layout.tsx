
import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'NetPulse CAF | WiFi Analyzer',
  description: 'Enterprise WiFi analyzer specifically for CAF-WIFI network monitoring.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary/30">
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
