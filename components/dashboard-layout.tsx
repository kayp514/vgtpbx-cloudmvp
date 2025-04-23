import { ReactNode } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: ReactNode
  className?: string
}

export function DashboardLayout({ children, className}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        {/*main content are*/}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className={cn("container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-7xl", className)}>{children}</div>
        </main>
      </div>
    </div>
  )
}