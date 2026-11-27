import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "TALLER — estación de composición",
  description:
    "Editor LaTeX de tres pantallas: fuente, composición visual y prueba renderizada. Exporta a PDF, ODT, LaTeX, Markdown, TXT, RTF, HTML y EPUB.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700;9..144,900&family=Source+Serif+4:ital,opsz,wght@0,8..60,300..700;1,8..60,300..700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
