"use client"

import { useRouter } from "next/navigation"

import { BreadcrumbNav } from "./breadcrumb-nav"

export function Header() {
  const router = useRouter()

  return (
    <header className="flex h-14 items-center border-b px-6">
      <div>
        <BreadcrumbNav />
      </div>
    </header>
  )
} 