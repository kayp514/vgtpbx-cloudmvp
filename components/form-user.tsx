"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PbxUserDisplay } from "@/lib/db/types"
import { RefreshCw } from "lucide-react"

interface UserFormProps {
  user: PbxUserDisplay | null
  onSubmit: (userData: any) => void
  onCancel: () => void
}

export function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    firstName: user?.auth_user.firstName || "",
    lastName: user?.auth_user.lastName || "",
    displayName: user?.auth_user.displayName || "",
    email: user?.email || "",
    disabled: user?.disabled || false,
    isAdmin: user?.auth_user.isAdmin || false,
    isSuperuser: user?.auth_user.isSuperuser || false,
    isStaff: user?.auth_user.isStaff || false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when field is edited
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Update display name when first or last name changes
  const updateDisplayName = () => {
    if (!formData.displayName || formData.displayName === `${user?.auth_user.firstName} ${user?.auth_user.lastName}`) {
      setFormData((prev) => ({
        ...prev,
        displayName: `${prev.firstName} ${prev.lastName}`.trim(),
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Display name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error("Form submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
      <div className="grid gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              onBlur={updateDisplayName}
              placeholder="John"
              className={errors.firstName ? "border-red-500" : ""}
            />
            {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lastName">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              onBlur={updateDisplayName}
              placeholder="Doe"
              className={errors.lastName ? "border-red-500" : ""}
            />
            {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="displayName">
            Display Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="displayName"
            value={formData.displayName}
            onChange={(e) => handleChange("displayName", e.target.value)}
            placeholder="John Doe"
            className={errors.displayName ? "border-red-500" : ""}
          />
          {errors.displayName && <p className="text-sm text-red-500">{errors.displayName}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="john.doe@example.com"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>

        <div className="grid gap-4">
          <Label>User Roles & Permissions</Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAdmin"
                checked={formData.isAdmin}
                onCheckedChange={(checked) => handleChange("isAdmin", checked)}
              />
              <Label htmlFor="isAdmin" className="font-normal">
                Administrator (Full system access)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSuperuser"
                checked={formData.isSuperuser}
                onCheckedChange={(checked) => handleChange("isSuperuser", checked)}
              />
              <Label htmlFor="isSuperuser" className="font-normal">
                Superuser (Advanced system access)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isStaff"
                checked={formData.isStaff}
                onCheckedChange={(checked) => handleChange("isStaff", checked)}
              />
              <Label htmlFor="isStaff" className="font-normal">
                Staff (Limited system access)
              </Label>
            </div>
          </div>
        </div>

        {user && (
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="disabled"
              checked={formData.disabled}
              onCheckedChange={(checked) => handleChange("disabled", checked)}
            />
            <Label htmlFor="disabled" className="font-normal">
              Disable this user account
            </Label>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {user ? "Updating..." : "Creating..."}
            </>
          ) : user ? (
            "Update User"
          ) : (
            "Create User"
          )}
        </Button>
      </div>
    </form>
  )
}

