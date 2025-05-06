"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DialplanList } from "@/components/list-dialplan"
import { DialplanFilters } from "@/components/dialplan-filters"
import { DialplanPagination } from "@/components/dialplan-pagination"
import { Button } from "@/components/ui/button"
import { PlusCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateDialplanXml } from "@/app/actions-deleted"
import type { CombinedDialplanXmlDisplay } from "@/lib/db/types"

export function DialplanDashboard() {
  const [activeTab, setActiveTab] = useState("domain")
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [enabled, setEnabled] = useState<boolean | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [domainDialplans, setDomainDialplans] = useState<CombinedDialplanXmlDisplay[]>([])
  const [defaultDialplans, setDefaultDialplans] = useState<CombinedDialplanXmlDisplay[]>([])
  const [total, setTotal] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    loadDialplans()
  }, [page, limit, searchTerm, enabled])

  const loadDialplans = async () => {
    setLoading(true)
    try {
       const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      if (enabled !== undefined) {
        params.append('enabled', enabled.toString())
      }

      const response = await fetch(`/api/dialplan?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch dialplans')
      }

      const data = await response.json()

      setDomainDialplans(data.data.domain)
      setDefaultDialplans(data.data.default)
      setTotal(data.pagination.total)

    } catch (error) {
      toast({
        title: "Error loading dialplans",
        description: "There was a problem loading the dialplans. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadDialplans()
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setPage(1)
  }

  const handleEnabledFilter = (value: boolean | undefined) => {
    setEnabled(value)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  const handleUpdateDialplan = async (id: string, updatedXml: string) => {
    try {
      await updateDialplanXml(
        id, 
        updatedXml,
        activeTab as "domain" | "default"
    )

      // Update the local state to reflect the changes
      if (activeTab === "domain") {
        setDomainDialplans(domainDialplans.map((dp) => (dp.id === id ? { ...dp, xml: updatedXml } : dp)))
      } else {
        setDefaultDialplans(defaultDialplans.map((dp) => (dp.id === id ? { ...dp, xml: updatedXml } : dp)))
      }

      toast({
        title: "Dialplan Updated",
        description: "The dialplan XML has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating dialplan:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update the dialplan. Please try again.",
        variant: "destructive",
      })
      throw error // Re-throw to let the component handle it
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <DialplanFilters
          searchTerm={searchTerm}
          enabled={enabled}
          onSearchChange={handleSearch}
          onEnabledChange={handleEnabledFilter}
        />
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Dialplan
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="domain">Domain Dialplans</TabsTrigger>
          <TabsTrigger value="default">Default Dialplans</TabsTrigger>
        </TabsList>
        <TabsContent value="domain" className="mt-6">
          <DialplanList 
          dialplans={domainDialplans} 
          loading={loading} 
          type="domain" 
          onUpdateDialplan={handleUpdateDialplan}
          />
        </TabsContent>
        <TabsContent value="default" className="mt-6">
          <DialplanList 
          dialplans={defaultDialplans} 
          loading={loading} 
          type="default" 
          onUpdateDialplan={handleUpdateDialplan}
          />
        </TabsContent>
      </Tabs>

      <DialplanPagination
        currentPage={page}
        totalItems={total}
        pageSize={limit}
        onPageChange={handlePageChange}
        onPageSizeChange={handleLimitChange}
      />
    </div>
  )
}
