"use client"

import React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { SidebarContent } from "@/components/sidebar-content"


export function Sidebar() {
  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarContent />
    </SidebarProvider>
  )
}