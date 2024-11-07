// src/components/layouts/root-layout.tsx
import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/navigation/navbar";

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-7xl p-6">
        <Outlet />
      </main>
    </div>
  );
}