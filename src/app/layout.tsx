import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NutriMood - AI Food Recommendations Based on Your Nutrition & Mood",
  description:
    "Dapatkan rekomendasi makanan Indonesia terbaik berdasarkan analisis AI dari tingkat nutrisi dan mood Anda. 100% Gratis selamanya!",
  keywords:
    "nutrisi, mood, makanan indonesia, AI, kesehatan, rekomendasi makanan",
  authors: [{ name: "NutriMood Team" }],
  openGraph: {
    title: "NutriMood - Temukan Makanan Sesuai Mood Anda",
    description:
      "Platform AI untuk rekomendasi makanan Indonesia berdasarkan nutrisi dan mood. Gratis untuk semua!",
    type: "website",
    locale: "id_ID",
    siteName: "NutriMood",
  },
  twitter: {
    card: "summary_large_image",
    title: "NutriMood - Temukan Makanan Sesuai Mood Anda",
    description:
      "Platform AI untuk rekomendasi makanan Indonesia berdasarkan nutrisi dan mood. Gratis untuk semua!",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            <div className="min-h-screen bg-background text-foreground">
              <Navbar />
              <main>{children}</main>
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
