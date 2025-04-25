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

  const extensionsData = response.data
  console.log(extensionsData)
  const transformedExtensions: ExtensionDisplay[] = extensionsData.map((ext: any) => ({
      id: ext.id,
      extension: ext.extension,
      effective_caller_id_name: ext.effective_caller_id_name,
      effective_caller_id_number: ext.effective_caller_id_number,
      call_group: ext.call_group,
      disabled: ext.disabled,
    }));

  return transformedExtensions

}

export default async function ExtensionsPage() {
  const extensions = await getExtensions()
  
  return <Extensions extensions={extensions} />
}
