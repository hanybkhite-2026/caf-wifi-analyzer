export const metadata = { title: 'CAF-WIFI', description: 'Enterprise WiFi Analyzer' };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
      </head>
      <body style={{margin:0,padding:0,background:'#0d1117'}}>{children}</body>
    </html>
  );
}
