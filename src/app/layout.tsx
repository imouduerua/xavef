import type { Metadata } from "next";
import { Share_Tech } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";

const shareTech = Share_Tech({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-share-tech",
});

export const metadata: Metadata = {
  title: "XAVEF Financials",
  description: "Your partner in financial success.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${shareTech.variable} font-body antialiased`}>
          <FirebaseClientProvider>
            {children}
          </FirebaseClientProvider>
          <Toaster />
      </body>
    </html>
  );
}
