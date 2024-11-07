import { Outlet } from "react-router-dom"
import { MainNav } from "@/components/old?/nav"

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center">
          <MainNav />
        </div>
      </div>
      <main className="container mx-auto py-6">
        <Outlet />
      </main>
    </div>
  )
} 