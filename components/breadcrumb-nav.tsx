"use client"

import React from "react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ChevronRight } from "lucide-react"

const segmentsWithoutPages = ['settings', 'siptrunks', 'switch', 'monitoring', 'users-and-auth', 'tenants', 'ext-numbers']

const hasOwnPage = (segment: string, index: number, segments: string[]) => {
  const lowerSegment = segment.toLowerCase()

  if (lowerSegment === 'dashboard') {
    return true
  }
  
  if (segmentsWithoutPages.includes(lowerSegment)) {
    return false
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(segment)) {
    return false
  }

  if (index < segments.length - 1 && segmentsWithoutPages.includes(segments[index + 1].toLowerCase())) {
    return false
  }
  return true
}

export function BreadcrumbNav() {
    const pathname = usePathname()

    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
      flushCache: false,
      reloadAcl: false,
      reloadXml: false,
      refresh: false,
    })
    
  
    const handleAction = (action: string) => {
      setIsLoading({ ...isLoading, [action]: true })
  
      // Simulate API call
      setTimeout(() => {
        setIsLoading({ ...isLoading, [action]: false })
        console.log(`Action triggered: ${action}`)
      }, 1000)
    }

    const breadcrumbs = React.useMemo(() => {
        const pathSegments = pathname.split("/").filter(Boolean)
        if (pathSegments.length === 0) {
          return [{ name: "Dashboard", href: "/dashboard", hasOwnPage: true }]
        }
        return pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join("/")}`
          return {
            name: segment.charAt(0).toUpperCase() + segment.slice(1),
            href,
            hasOwnPage: hasOwnPage(segment, index, pathSegments)
          }
        })
      }, [pathname])

return (
    <div className="flex w-full items-center justify-between">
    <Breadcrumb>
    <BreadcrumbList>
    {breadcrumbs.map((crumb, index) => (
      <React.Fragment key={crumb.href}>
        <BreadcrumbItem>
          {index === breadcrumbs.length - 1 ? (
            <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
          ) : (
            crumb.hasOwnPage ? (
              <BreadcrumbLink href={crumb.href}>{crumb.name}</BreadcrumbLink>
            ) : (
              <span className="text-muted-foreground">{crumb.name}</span>
            )
          )}
        </BreadcrumbItem>
        {index < breadcrumbs.length - 1 && (
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
        )}
      </React.Fragment>
    ))}
    {breadcrumbs.length === 1 && (
      <BreadcrumbSeparator>
        <ChevronRight className="h-4 w-4" />
      </BreadcrumbSeparator>
    )}
  </BreadcrumbList>
</Breadcrumb>
</div>
)
}