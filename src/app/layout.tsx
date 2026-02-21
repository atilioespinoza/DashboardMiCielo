import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mi Cielo - Dashboard Estratégico",
  description: "Panel de control comercial, operativo y de marketing para Mi Cielo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
