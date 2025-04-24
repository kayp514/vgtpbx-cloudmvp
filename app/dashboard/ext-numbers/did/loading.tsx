import { PageHeader, PageWrapper} from "@/components/page-layout"
import { DIDSkeleton } from "@/components/skeleton"

export default function Loading() {
  return (
    <PageWrapper>
      <PageHeader 
        title="DID Numbers" 
        description="Manage your direct inward dialing phone numbers"
      />
        <DIDSkeleton />
    </PageWrapper>
  )
}