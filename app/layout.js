import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalLoaderProvider } from "@/components/ui/GlobalLoaderProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Detty Fusion Admin",
  description: "Admin panel for Detty Fusion",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        <GlobalLoaderProvider>
          {children}
        </GlobalLoaderProvider>
      </body>
    </html>
  );
}
