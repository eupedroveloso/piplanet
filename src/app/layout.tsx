import type { Metadata, Viewport } from "next";
import { Andika, Baloo_2 } from "next/font/google";
import { ProvedorMovimento } from "@/components/ui/movimento";
import "./globals.css";

/** Baloo 2: fonte de títulos e interface, redonda e amigável. */
const baloo = Baloo_2({
  variable: "--font-baloo",
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
});

/**
 * Andika: fonte criada para alfabetização. Usada em letras e sílabas.
 * Letras bem distintas (a de uma "barriga" só, l com perninha, I com serifa).
 */
const andika = Andika({
  variable: "--font-andika",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pietro Games",
  description: "Uma jornada pelos territórios dos animais para aprender a ler.",
  appleWebApp: { capable: true, title: "Pietro Games", statusBarStyle: "default" },
  icons: { icon: "/arte/animais/coruja.svg" },
};

export const viewport: Viewport = {
  themeColor: "#f6f2fd",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${baloo.variable} ${andika.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ProvedorMovimento>{children}</ProvedorMovimento>
      </body>
    </html>
  );
}
