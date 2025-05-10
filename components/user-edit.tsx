"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageWrapper } from "@/components/page-layout"
import { UserEditHeader } from "@/components/headers"
import { toast } from "sonner"
import { AccountStatusCard, AuthUserCard, ExtensionSettingsCard, PbxUserCard } from "@/components/cards"
import type { PbxUserDisplay, Extension } from "@/lib/db/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UserEditFormProps {
  initialUser: PbxUserDisplay & {
    extension?: Extension
  }
}

export function UserEdit({
   initialUser 
}: UserEditFormProps) {
  const router = useRouter()
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false)
  const [isPbxSubmitting, setIsPbxSubmitting] = useState(false)
  const [user, setUser] = useState<PbxUserDisplay>(initialUser)
  const [activeTab, setActiveTab] = useState("general")

  const handleAuthUserChange = (field: string, value: any) => {
    setUser(prev => ({
      ...prev,
      auth_user: {
        ...prev.auth_user,
        [field]: value
      }
    }))
  }

  const handlePbxUserChange = (field: string, value: any) => {
    setUser(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleExtensionChange = (field: string, value: any) => {
    setUser(prev => ({
      ...prev,
      extension: prev.extension ? {
        ...prev.extension,
        [field]: value
      } : undefined
    }))
  }

  const handleAuthSave = async () => {
    setIsAuthSubmitting(true)
    try {
      const response = await fetch(`/api/users/${user.auth_user_id}/auth`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: user.auth_user.displayName,
          firstName: user.auth_user.firstName,
          lastName: user.auth_user.lastName,
          isAdmin: user.auth_user.isAdmin,
          isSuperuser: user.auth_user.isSuperuser,
          isStaff: user.auth_user.isStaff,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update user account')
      }

      toast.success('Account settings saved successfully')
      router.refresh()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to save account settings')
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  const handlePbxSave = async () => {
    setIsPbxSubmitting(true)
    try {
      const response = await fetch(`/api/users/${user.auth_user_id}/pbx`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          email: user.email,
          disabled: user.disabled,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update PBX settings')
      }

      toast.success('PBX settings saved successfully')
      router.refresh()
    } catch (error) {
      console.error('Error updating PBX settings:', error)
      toast.error('Failed to save PBX settings')
    } finally {
      setIsPbxSubmitting(false)
    }
  }

  return (
    <PageWrapper>
      <UserEditHeader user={user} />
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList 
          className="inline-flex h-10 items-center justify-center rounded-md bg-muted/20 p-1 text-muted-foreground mb-0"
        >
          <TabsTrigger 
            value="general" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            General
          </TabsTrigger>
          <TabsTrigger 
            value="calling" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Call Features
          </TabsTrigger>
          <TabsTrigger 
            value="Advanced" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Advanced
          </TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="mt-2 animate-in fade-in-50">
           <div className="space-y-6">
          <AuthUserCard
          user={user}
          onUserChange={handleAuthUserChange}
          onSave={handleAuthSave}
          isLoading={isAuthSubmitting}
        />
        <PbxUserCard
          user={user}
          onUserChange={handlePbxUserChange}
          onSave={handlePbxSave}
          isLoading={isPbxSubmitting}
        />
        <ExtensionSettingsCard
          extension={user.extension}
          handleExtensionChange={handleExtensionChange}
        />
        <AccountStatusCard
          user={user}
          handleChange={handlePbxUserChange}
        />
        </div>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  )
}
