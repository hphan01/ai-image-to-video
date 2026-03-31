import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VidForge — AI Image to Video",
  description: "Transform any image into a cinematic 60-second video with AI-generated motion and background music.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} min-h-screen`} style={{ background: '#1e1e1e', color: '#d4d4d4' }}
      >
        {children}
      </body>
    </html>
  );
}
