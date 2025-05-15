import { DIDEditPage } from "@/components/did-edit"
import { cookies } from "next/headers"
import type { 
  DidExtDisplay,
  Extension 
} from "@/lib/db/types"

export const dynamic = "force-dynamic"


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

async function getDidExt(
  id: string
): Promise<Extension> {
  const cookieStore = (await cookies())
  
  const res = await fetch(`${API_BASE_URL}/api/extensions/${id}`, {
    headers: {
      Cookie: cookieStore.toString(),
    },
    cache: 'no-store',
  })

  const response = await res.json()
  
  if (!res.ok) {
    throw new Error('Failed to fetch extensions')
  }

  const ext = response.data

  return ext
}


interface EditDidPageProps {
  params: {
    id: string
  }
}


export default async function EditDIDPage({ 
  params 
}: EditDidPageProps) {
  const { id } = params
  const did = await getDidExt(id)

  return <DIDEditPage initialDid={did} />
}
