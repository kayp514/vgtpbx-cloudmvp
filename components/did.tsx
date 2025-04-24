'use client'

import { useState } from "react"
import { PageHeader, PageWrapper } from "@/components/page-layout"
import { DIDTable } from "@/components/table-did"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { DIDForm } from "@/components/form-did"

export function Did() {
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingDID, setEditingDID] = useState<string | null>(null)
    
    return (
    <PageWrapper>
      <PageHeader 
       title="DID Numbers" 
       description="Manage your direct inward dialing phone numbers"
       actions={
       <Button className="gap-2" onClick={() => setShowAddForm(true)}>
        <Plus className="h-4 w-4" />
        Add Number
        </Button>
        }
        />
        <DIDTable onEdit={(didId) => setEditingDID(didId)} />

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
    </PageWrapper>
  )
}