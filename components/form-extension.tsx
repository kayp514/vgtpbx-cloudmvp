"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Check, Pencil, X } from "lucide-react"
import { addExtension } from "@/app/actions"
import { toast } from "sonner"

interface ExtensionFormProps {
  uid: string
  extensionId: string | null
  onClose: () => void
}

export function ExtensionForm({ uid, extensionId, onClose }: ExtensionFormProps) {
  
  const [formData, setFormData] = useState({
    extension: "",
    password: "",
    description: "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <form
          action={async (formData: FormData) => {
            formData.append("uid", uid)

            const result = await addExtension(formData)

            if (!result.success) {
              toast.error("Error", {
                description: result.error || "Failed to add extension",
                duration: 5000,
              })
              return
            }
            
            toast.success("", {
              description: "Extension added successfully",
              duration: 5000,
            })
            onClose()
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {extensionId ? (
                <>
                  <Pencil className="h-5 w-5 text-primary" />
                  Edit Extension
                </>
              ) : (
                <>
                  <Pencil className="h-5 w-5 text-primary" />
                  Add Extension
                </>
              )}
            </CardTitle>
            <CardDescription>
              {extensionId ? "Edit the details of the selected extension" : "Create a new extension"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="extension">Extension Number</Label>
                <Input
                  id="extension"
                  name="extension"
                  value={formData.extension}
                  onChange={(e) => handleChange("extension", e.target.value)}
                  className="h-9"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="h-9"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="h-9"
                />
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
              {extensionId ? "Save Changes" : "Create Extension"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
