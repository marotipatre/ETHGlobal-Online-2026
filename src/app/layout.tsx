import type { Metadata } from "next";
import { Space_Grotesk, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "ArcFlow | Chain-Abstracted Payments",
  description: "Submit intents from Somnia, Base Sepolia, or Monad Testnet and track execution on Arc Testnet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${outfit.variable} antialiased`}
      >
        <Providers>
          <Navbar />
          <main className="app-shell">
            <div className="app-content">{children}</div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
