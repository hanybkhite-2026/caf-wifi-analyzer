export const metadata = {
  title: 'CAF-WIFI',
  description: 'Enterprise WiFi Analyzer v3.0.0',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="theme-color" content="#0d1117"/>
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0d1117', overscrollBehavior: 'none' }}>
        {children}
      </body>
    </html>
  );
}
