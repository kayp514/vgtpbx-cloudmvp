import { PageHeader, PageWrapper} from "@/components/page-layout"
import { DIDSkeleton } from "@/components/skeleton"

export default function Loading() {
  return (
    <PageWrapper>
      <PageHeader 
        title="Numbers" 
        description="Manage your DID and EXT"
      />
        <DIDSkeleton />
    </PageWrapper>
  )
}