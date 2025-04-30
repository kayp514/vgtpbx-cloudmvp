"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  Loader2,
  Save, 
  UserX, 
  AlertTriangle, 
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { 
  PbxUserDisplay,
  ExtensionDisplay,
  Extension,
  ExtensionUser
} from "@/lib/db/types"

interface UserCardProps {
  user: PbxUserDisplay
  onUserChange: (field: string, value: any) => void
  onSave: () => Promise<void>
  isLoading: boolean
}

interface AccountStatusCardProps {
  user: PbxUserDisplay
  handleChange: (field: string, value: any) => void
}

interface ExtensionSettingsCardProps {
  extension?: Extension
  handleExtensionChange: (field: string, value: any) => void
}

interface CallForwardingCardProps {
  extension: Extension
  handleForwardingChange: (field: string, value: any) => void
}

export function CallForwardingCard({ extension, handleForwardingChange }: CallForwardingCardProps) {
  if (!extension?.forward_all_enabled) {
    return null
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          Call Forwarding
        </CardTitle>
        <CardDescription>Forward calls to another number</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="forwardingEnabled" className="text-sm font-medium">
            Enable Call Forwarding
          </Label>
          <Switch
            id="forwardingEnabled"
            checked={!extension.forward_all_enabled || false}
            onCheckedChange={(checked) => handleForwardingChange("enabled", checked)}
            disabled={extension?.disabled}
          />
        </div>

        {extension.callForwarding.enabled ? (
          <div className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="forwardingRule" className="text-sm font-medium">
                Forwarding Rule
              </Label>
              <RadioGroup
                id="forwardingRule"
                value={extension.callForwarding.rule || "No Answer"}
                onValueChange={(value) => handleForwardingChange("rule", value)}
                className="grid grid-cols-2 gap-2"
              >
                {forwardingRules.map((rule) => (
                  <div key={rule} className="flex items-center space-x-2">
                    <RadioGroupItem value={rule} id={`rule-${rule}`} />
                    <Label htmlFor={`rule-${rule}`} className="text-sm font-normal">
                      {rule}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="forwardingDestination" className="text-sm font-medium">
                Destination Number
              </Label>
              <Input
                id="forwardingDestination"
                value={user.extension.callForwarding.destination || ""}
                onChange={(e) => handleForwardingChange("destination", e.target.value)}
                placeholder="+1 (555) 987-6543"
                className="h-9 max-w-md"
              />
            </div>

            {user.extension.callForwarding.rule !== "Always" && (
              <div className="grid gap-2">
                <Label htmlFor="ringTime" className="text-sm font-medium">
                  Ring Time (seconds)
                </Label>
                <Select
                  value={user.extension.callForwarding.ringTime?.toString() || "20"}
                  onValueChange={(value) => handleForwardingChange("ringTime", Number.parseInt(value))}
                >
                  <SelectTrigger id="ringTime" className="h-9 max-w-md">
                    <SelectValue placeholder="Select ring time" />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 15, 20, 25, 30, 45, 60].map((time) => (
                      <SelectItem key={time} value={time.toString()}>
                        {time} seconds
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-20 items-center justify-center text-muted-foreground">
            <p className="text-sm">Call forwarding is disabled</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ExtensionSettingsCard({ 
  extension, 
  handleExtensionChange 
}: ExtensionSettingsCardProps) {
  const extensionUser = extension?.pbx_extension_users?.[0];
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          Extension
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <Label htmlFor="extensionEnabled" className="text-sm font-medium">
            Extension Status
          </Label>
          <Switch
            id="extensionEnabled"
            checked={!extension?.disabled || false}
            onCheckedChange={(checked) => handleExtensionChange("disabled", !checked)}
          />
        </div>

        <div className="grid gap-2">
            <Label htmlFor="extensionNumber" className="text-sm font-medium">
              Extension Number
            </Label>
            <Input
              id="extensionNumber"
              value={extension?.extension || ""}
              onChange={(e) => handleExtensionChange("extension", e.target.value)}
              disabled={extension?.disabled}
              className="h-9 max-w-md"
            />
        </div>

        <div className="space-y-3 border-t pt-3">
          <h3 className="text-sm font-medium">Internal Caller Settings</h3>

          <div className="flex items-center justify-between">
              <Label htmlFor="effectiveCallerIdName" className="text-sm font-normal text-muted-foreground">
                Internal Caller ID
              </Label>
              <Switch
              id="useExtensionAsInternalCallerId"
              checked={!extension?.effective_caller_id_number || false}
              onCheckedChange={(checked) => handleExtensionChange("useAsInternalCallerId", checked)}
              disabled={extension?.disabled}
              />
          </div>

            <div className="flex items-center justify-between">
            <Label htmlFor="useExtensionAsInternalCallerName" className="text-sm font-normal text-muted-foreground">
              Use as Internal Caller Name
            </Label>
            <Switch
              id="useExtensionAsInternalCallerName"
              checked={!extension?.effective_caller_id_name || false}
              onCheckedChange={(checked) => handleExtensionChange("useAsInternalCallerName", checked)}
              disabled={!extension?.disabled}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AuthUserCard({ user, onUserChange, onSave, isLoading }: UserCardProps) {
  const handleChange = (field: string, value: any) => {
    onUserChange(field, value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>
          Manage user account information and role permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={user.auth_user.firstName || ""}
              onChange={(e) => handleChange("firstName", e.target.value)}
              placeholder="First name"
              className="h-9 max-w-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={user.auth_user.lastName || ""}
              onChange={(e) => handleChange("lastName", e.target.value)}
              placeholder="Last name"
              className="h-9 max-w-md"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={user.auth_user.displayName || ""}
            onChange={(e) => handleChange("displayName", e.target.value)}
            placeholder="Display name"
            className="h-9 max-w-md"
          />
        </div>

        <div className="space-y-3">
          <Label>Roles & Permissions</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAdmin"
                checked={user.auth_user.isAdmin}
                onCheckedChange={(checked) => handleChange("isAdmin", checked)}
              />
              <Label htmlFor="isAdmin" className="font-normal">
                Administrator
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSuperuser"
                checked={user.auth_user.isSuperuser}
                onCheckedChange={(checked) => handleChange("isSuperuser", checked)}
              />
              <Label htmlFor="isSuperuser" className="font-normal">
                Superuser
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isStaff"
                checked={user.auth_user.isStaff}
                onCheckedChange={(checked) => handleChange("isStaff", checked)}
              />
              <Label htmlFor="isStaff" className="font-normal">
                Staff
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={onSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Save
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export function PbxUserCard({ user, onUserChange, onSave, isLoading }: UserCardProps) {
  const handleChange = (field: string, value: any) => {
    onUserChange(field, value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>PBX Settings</CardTitle>
        <CardDescription>
          Configure PBX-specific user settings and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={user.username || ""}
            onChange={(e) => handleChange("username", e.target.value)}
            placeholder="Username"
            className="h-9 max-w-md"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="pbx@example.com"
            className="h-9 max-w-md"
          />
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={onSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {/*<Save className="mr-2 h-4 w-4" />*/}
              Save
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}


export function AccountStatusCard({
   user, 
   handleChange 
}: AccountStatusCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          Account Status
        </CardTitle>
        <CardDescription>Manage account activation status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="disabled"
              checked={user.disabled || false}
              onCheckedChange={(checked) => handleChange("disabled", checked)}
            />
            <div className="space-y-0.5">
              <Label htmlFor="disabled" className="text-sm font-medium">
                Disable Account
              </Label>
              <p className="text-xs text-muted-foreground">
                When disabled, the user cannot log in or use any system features
              </p>
            </div>
          </div>
        </div>

        {user.disabled && (
          <div className="mt-4 rounded-md bg-amber-50 p-3 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            <div className="flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4" />
              <p className="text-sm">This account is currently disabled</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}