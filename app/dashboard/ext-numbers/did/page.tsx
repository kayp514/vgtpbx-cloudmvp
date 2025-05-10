import { Did } from "@/components/did"
import { cookies } from "next/headers"
import type { DidExtDisplay} from "@/lib/db/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

async function getDidExt(): Promise<DidExtDisplay[]> {
  const cookieStore = (await cookies())
  
  const res = await fetch(`${API_BASE_URL}/api/extensions`, {
    headers: {
      Cookie: cookieStore.toString(),
    },
    cache: 'no-store',
  })

  const response = await res.json()
  
  if (!res.ok) {
    throw new Error('Failed to fetch extensions')
  }

  const didExtData = response.data
  console.log(didExtData)
  const transformedDidExt: DidExtDisplay[] = didExtData.map((ext: any) => ({
      id: ext.id,
      extension: ext.extension,
      outbound_caller_id_number: ext.outbound_caller_id_number,
      disabled: ext.disabled,
    }));

  return transformedDidExt

}

export default async function DIDPage() {
  const did = await getDidExt()

  return <Did didExt={did} />
}
