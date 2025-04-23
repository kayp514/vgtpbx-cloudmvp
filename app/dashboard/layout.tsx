import { ReactNode } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Metadata } from "next"
import { Toaster } from "@/components/ui/sonner"
import { getUser } from "@tern-secure/nextjs/server"

export const metadata: Metadata = {
  title: "Dashboard | Cloud PBX",
  description: "Manage your cloud communication platform",
}

interface DashLayoutProps {
  children: ReactNode
}

export default  function DashLayout({ children }: DashLayoutProps) {
  const user  = getUser()

  if (!user) {
    return null
  }

  return (
  <DashboardLayout>
    {children}
    <Toaster position="top-center" />
  </DashboardLayout>
  )
}