import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAF-WIFI",
  description: "Enterprise WiFi Analyzer v3.0.0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0d1117" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#0d1117", overflow: "hidden", height: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
