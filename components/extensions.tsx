"use client"

import { useState } from "react"
import { PageHeader, PageWrapper } from "@/components/page-layout"
import { ExtensionsTable } from "@/components/table-extension"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ExtensionForm } from "@/components/form-extension"
import { useAuth } from "@tern-secure/nextjs"
import type { ExtensionDisplay } from "@/lib/db/types"

interface ExtensionsProps {
  extensions: ExtensionDisplay[]
}

export function Extensions({ extensions }: ExtensionsProps) {
  const { userId } = useAuth()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingExtension, setEditingExtension] = useState<string | null>(null)

  if(!userId) return null

  return (
    <PageWrapper>
      <PageHeader
        title="Extensions"
        description="Manage extensions"
        actions={
          <Button className="gap-2" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4" />
            Add Extension
          </Button>
        } 
      />

      <ExtensionsTable 
        extensions={extensions}
        onEdit={(extensionId) => setEditingExtension(extensionId)} 
      />

      {/* Add/Edit Extension Dialog */}
      {(showAddForm || editingExtension) && (
        <ExtensionForm
          uid={userId}
          extensionId={editingExtension}
          onClose={() => {
            setShowAddForm(false)
            setEditingExtension(null)
          }}
        />
      )}
    </PageWrapper>
  )
}
