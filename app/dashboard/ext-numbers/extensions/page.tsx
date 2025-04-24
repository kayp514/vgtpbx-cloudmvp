import { Extensions } from "@/components/extensions"
import { cookies } from "next/headers"
import type { ExtensionDisplay } from "@/lib/db/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

async function getExtensions(): Promise<ExtensionDisplay[]> {
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

  const extension = response.data
  console.log(extension)
    const transformedExtension: ExtensionDisplay = {
      id: extension.id,
      extension: extension.extension,
      outbound_caller_id_name: extension.outbound_caller_id_name,
      outbound_caller_id_number: extension.outbound_caller_id_number,
      call_group: extension.call_group,
      disabled: extension.disabled,
    }

  return [transformedExtension]

}

export default async function ExtensionsPage() {
  const extensions = await getExtensions()
  
  return <Extensions extensions={extensions} />
}
