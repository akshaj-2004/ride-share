
"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* Global Navbar with Theme Toggle */}
          <nav className="fixed top-0 right-0 p-4 z-50">
            <ThemeToggle />
          </nav>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}