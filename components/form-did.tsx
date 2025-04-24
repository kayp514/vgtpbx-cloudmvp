"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Pencil, X } from "lucide-react"

interface DIDFormProps {
  didId: string | null
  onClose: () => void
}

export function DIDForm({ didId, onClose }: DIDFormProps) {
  const [formData, setFormData] = useState({
    number: "",
    region: "us",
    type: "local",
    status: "active",
    assignedTo: "",
  })

  // Mock function to fetch DID data
  useEffect(() => {
    if (didId) {
      // In a real app, this would be an API call
      // For now, we'll just simulate with mock data
      setFormData({
        number: "+1 (555) 123-4567",
        region: "us",
        type: "local",
        status: "active",
        assignedTo: "John Smith",
      })
    }
  }, [didId])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would save the data to the backend
    console.log("Saving DID:", formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {didId ? (
                <>
                  <Pencil className="h-5 w-5 text-primary" />
                  Edit Number
                </>
              ) : (
                <>
                  <Pencil className="h-5 w-5 text-primary" />
                  Add Number
                </>
              )}
            </CardTitle>
            <CardDescription>
              {didId ? "Edit the details of the selected phone number" : "Add a new phone number"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="didNumber">Phone Number</Label>
                <Input
                  id="didNumber"
                  value={formData.number}
                  onChange={(e) => handleChange("number", e.target.value)}
                  className="h-9"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="didRegion">Region</Label>
                <Select value={formData.region} onValueChange={(value) => handleChange("region", value)}>
                  <SelectTrigger id="didRegion" className="h-9 w-full">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">US</SelectItem>
                    <SelectItem value="ca">CA</SelectItem>
                    <SelectItem value="uk">UK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="didType">Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                  <SelectTrigger id="didType" className="h-9 w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="toll-free">Toll-Free</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="didStatus">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger id="didStatus" className="h-9 w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="didAssignedTo">Assigned To (Optional)</Label>
                <Select
                  value={formData.assignedTo || "none"}
                  onValueChange={(value) => handleChange("assignedTo", value === "none" ? "" : value)}
                >
                  <SelectTrigger id="didAssignedTo" className="h-9 w-full">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="John Smith">John Smith (Ext. 101)</SelectItem>
                    <SelectItem value="Sarah Johnson">Sarah Johnson (Ext. 102)</SelectItem>
                    <SelectItem value="Michael Brown">Michael Brown (Ext. 103)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t p-4 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit">
              <Check className="mr-2 h-4 w-4" />
              {didId ? "Save Changes" : "Add Number"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
