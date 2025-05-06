import { Suspense } from "react"
import { DialplanDashboard } from "@/components/dialplan-dashboard"
import { PageHeader } from "@/components/page-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function DialplansPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader 
      title="Dialplans" 
      description="Manage your domain and default dialplans"
      />

      <Suspense fallback={<DialplanDashboardSkeleton />}>
        <DialplanDashboard />
      </Suspense>
    </div>
  )
}

function DialplanDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[200px]" />
      </div>
      <Skeleton className="h-[600px] w-full" />
    </div>
  )
}
