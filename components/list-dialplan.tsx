"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, Code, CheckCircle, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { XmlViewer } from "@/components/xml-viewer"
import type { CombinedDialplanXmlDisplay } from "@/lib/db/types"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface DialplanListProps {
  dialplans: CombinedDialplanXmlDisplay[]
  loading: boolean
  type: "domain" | "default"
  onUpdateDialplan?: (id: string, updatedXml: string) => Promise<void>
}

export function DialplanList({ 
    dialplans, 
    loading, 
    type, 
    onUpdateDialplan 
}: DialplanListProps) {
  const [selectedDialplan, setSelectedDialplan] = useState<CombinedDialplanXmlDisplay | null>(null)
  const [viewXml, setViewXml] = useState(false)
  const [savingXml, setSavingXml] = useState(false)
  const { toast } = useToast()

  const handleViewXml = (dialplan: CombinedDialplanXmlDisplay) => {
    setSelectedDialplan(dialplan)
    setViewXml(true)
  }

  const closeXmlDialog = () => {
    setViewXml(false)
    setSelectedDialplan(null)
  }

  const handleSaveXml = async (updatedXml: string) => {
    if (!selectedDialplan || !onUpdateDialplan) return

    try {
      setSavingXml(true)
      await onUpdateDialplan(selectedDialplan.id, updatedXml)
      toast({
        title: "XML Updated",
        description: "The dialplan XML has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating dialplan XML:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update the dialplan XML. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingXml(false)
    }
  }

  if (loading) {
    return <DialplanListSkeleton />
  }

  if (dialplans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60 border rounded-lg">
        <p className="text-muted-foreground">No dialplans found</p>
        <Button variant="outline" className="mt-4">
          Create New Dialplan
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Context</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Sequence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dialplans.map((dialplan) => (
              <TableRow key={dialplan.id}>
                <TableCell className="font-medium">{dialplan.name || "Unnamed"}</TableCell>
                <TableCell>{dialplan.context || "N/A"}</TableCell>
                <TableCell>{dialplan.number || "N/A"}</TableCell>
                <TableCell>{dialplan.sequence.toString()}</TableCell>
                <TableCell>
                  {type === "domain" ? (
                    dialplan.enabled === "true" ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Enabled
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Disabled
                      </Badge>
                    )
                  ) : (dialplan as any).dp_enabled === "true" ? (
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Enabled
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Disabled
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleViewXml(dialplan)} title="View XML">
                      <Code className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" title="View Details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" title="Edit">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={viewXml} onOpenChange={closeXmlDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDialplan?.name || "Unnamed"} XML</DialogTitle>
          </DialogHeader>
          {selectedDialplan && (
          <XmlViewer xml={selectedDialplan.xml || ""} 
          onSave={handleSaveXml} 
          />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function DialplanListSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Context</TableHead>
            <TableHead>Number</TableHead>
            <TableHead>Sequence</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-5 w-[120px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[100px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[80px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[40px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[80px]" />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
