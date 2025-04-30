import { PageHeader, PageWrapper} from "@/components/page-layout"
import { EditUserLoading } from "@/components/skeleton"

export default function Loading() {
  return (
    <PageWrapper>
      <PageHeader 
        title="Extensions" 
        description="Manage extensions"
      />
        <EditUserLoading  />
    </PageWrapper>
  )
}