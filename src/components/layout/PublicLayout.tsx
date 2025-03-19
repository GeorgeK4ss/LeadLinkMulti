import React from "react";
import { MainNavbar } from "./MainNavbar";
import { Footer } from "./Footer";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <MainNavbar />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </div>
  );
} 