'use client'

import { useState } from "react"
import { PageWrapper } from "@/components/page-layout"
import { DidExtHeader } from "./headers"
import { DIDTable } from "@/components/table-did"
import { DIDForm } from "@/components/form-did"
import type { DidExtDisplay} from "@/lib/db/types"
import { DidExtSearch } from "@/components/search"
import { ExtensionForm } from "@/components/form-extension"
import { useAuth } from "@tern-secure/nextjs"

interface DidExtProps {
  didExt: DidExtDisplay[]
}

export function Did({ 
  didExt 
}: DidExtProps) {
    const { userId } = useAuth()
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingDID, setEditingDID] = useState<string | null>(null)
    const [showAddExtensionForm, setShowAddExtensionForm] = useState(false)
    const [editingExtension, setEditingExtension] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterRegion, setFilterRegion] = useState<string>("all")
    const [filterStatus, setFilterStatus] = useState<string>("all")

    const handleCreate = () => {
      setShowAddForm(true)
    }
    
    const handleCreateExtension = () => {
      setShowAddExtensionForm(true)
    }

    if(!userId) return null
    
    return (
    <PageWrapper>
      <DidExtHeader
        onCreate={handleCreate}
        onCreateExtensionOnly={handleCreateExtension}
      />
      <DidExtSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterRegion={filterRegion}
        setFilterRegion={setFilterRegion}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        />
      <DIDTable
        did={didExt}
        onEdit={(didId) => setEditingDID(didId)} 
      />

     {/* Add/Edit DID Dialog */}
      {(showAddForm || editingDID) && (
        <DIDForm
          didId={editingDID}
          onClose={() => {
            setShowAddForm(false)
            setEditingDID(null)
          }}
        />
      )}

      {/* Add/Edit Extension Dialog */}
      {(showAddExtensionForm || editingExtension) && (
        <ExtensionForm
          uid={userId}
          extensionId={editingExtension}
          onClose={() => {
            setShowAddExtensionForm(false)
            setEditingExtension(null)
          }}
        />
      )}
    </PageWrapper>
  )
}