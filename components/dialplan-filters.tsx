"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface DialplanFiltersProps {
  searchTerm: string
  enabled: boolean | undefined
  onSearchChange: (term: string) => void
  onEnabledChange: (enabled: boolean | undefined) => void
}

export function DialplanFilters({ searchTerm, enabled, onSearchChange, onEnabledChange }: DialplanFiltersProps) {
  const handleEnabledChange = (value: string) => {
    if (value === "all") {
      onEnabledChange(undefined)
    } else if (value === "enabled") {
      onEnabledChange(true)
    } else {
      onEnabledChange(false)
    }
  }

  return (
    <div className="flex gap-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search dialplans..."
          className="w-[250px] pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select
        value={enabled === undefined ? "all" : enabled ? "enabled" : "disabled"}
        onValueChange={handleEnabledChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="enabled">Enabled</SelectItem>
          <SelectItem value="disabled">Disabled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
