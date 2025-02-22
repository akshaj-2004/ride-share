// app/dashboard/layout.ts
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarFront, Clock, CreditCard, LogOut, Menu, MessageSquare, User, X, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { icon: CarFront, label: "Book a Ride", href: "/dashboard" },
  { icon: Share2, label: "Share Ride", href: "/dashboard/share" },
  { icon: Clock, label: "Ride History", href: "/dashboard/history" },
  { icon: CreditCard, label: "Payments", href: "/dashboard/payments" },
  { icon: MessageSquare, label: "Feedback", href: "/dashboard/feedback" },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card h-screen fixed top-0 left-0">
        <div className="p-6 border-b flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <CarFront className="h-6 w-6" />
            <span className="font-bold">RideShare</span>
          </Link>
        </div>
        <nav className="flex-1 p-4">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn("flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors mb-1",
                pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/auth/login">
              <LogOut className="mr-2 h-5 w-5" />
              Logout
            </Link>
          </Button>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background border-b">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <CarFront className="h-6 w-6" />
          <span className="font-bold">RideShare</span>
        </Link>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b flex justify-between">
                <Link href="/dashboard" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <CarFront className="h-6 w-6" />
                  <span className="font-bold">RideShare</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <nav className="flex-1 p-4">
                {sidebarItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                    className={cn("flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors",
                      pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
              <div className="p-4 border-t">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/auth/login">
                    <LogOut className="mr-2 h-5 w-5" />
                    Logout
                  </Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-6">{children}</main>
    </div>
  );
}