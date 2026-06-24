import "./globals.css";

export const metadata = {
  title: "BASE FARM — Your On-Chain Spirit & Farm",
  description:
    "Turn your Base network footprint into a magical farm and spirit. Read-only. No wallet connection needed.",
  openGraph: {
    title: "BASE FARM — Your On-Chain Spirit & Farm",
    description: "Visualize your Base activity as a magical spirit and farm.",
    type: "website",
  },
  other: {
    "base:app_id": "6a3bef36bef61265c48368b8",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
