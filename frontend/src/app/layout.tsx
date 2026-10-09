import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/oswald/600.css";
import "@fontsource/oswald/700.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Repz — seu treino, sua evolução",
  description: "Registre séries e cargas e acompanhe sua evolução na academia.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14171A",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-bg font-sans text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
