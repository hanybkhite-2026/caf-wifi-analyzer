import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAF-WIFI",
  description: "Enterprise WiFi Analyzer v3.0.0",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CAF-WIFI",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="CAF-WIFI"/>
        <meta name="theme-color" content="#0d1117"/>
        <link rel="manifest" href="/manifest.json"/>
        <link rel="apple-touch-icon" href="/icon-192.png"/>
      </head>
      <body style={{ margin:0, padding:0, background:"#0d1117", overflow:"hidden", height:"100vh" }}>
        {children}
      </body>
    </html>
  );
}
