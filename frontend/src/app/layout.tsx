import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CargoSync — Intelligent Freight & Fleet Orchestration",
  description: "Manage freight logistics, 3D cargo loading, QR-based chain of custody, and proof of delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
