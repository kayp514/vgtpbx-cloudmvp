"use client"

import { useState, useEffect} from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import type { 
  PbxUserDisplay,
  ExtensionDisplay,
  Extension,
  ExtensionUser,
} from "@/lib/db/types"


interface DirectoryCardProps {
  did: Extension
}

interface BasicInfoCardProps {
  did: Extension
}

interface DoNotDisturbCardProps {
  did: Extension
}

interface CallerIdCardProps {
  did: Extension
}

export function DoNotDisturbCard({ did }: DoNotDisturbCardProps) {
  const [enabled, setEnabled] = useState(did.do_not_disturb === "true")

  // Save the setting whenever it changes
  useEffect(() => {
    // Here you would typically call an API to save the changes
    console.log("Saving DND setting:", { do_not_disturb: enabled.toString() })

    // Don't show toast on initial load
    if (enabled !== (did.do_not_disturb === "true")) {
      toast.success(`Do Not Disturb ${enabled ? "enabled" : "disabled"}`)
    }
  }, [enabled, did.do_not_disturb])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Do Not Disturb</CardTitle>
        <CardDescription>When enabled, all calls will be sent directly to voicemail</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Switch id="do_not_disturb" checked={enabled} onCheckedChange={setEnabled} />
          <Label htmlFor="do_not_disturb">{enabled ? "Do Not Disturb is enabled" : "Do Not Disturb is disabled"}</Label>
        </div>
      </CardContent>
    </Card>
  )
}


export function DirectoryCard({ did }: DirectoryCardProps) {
  const [formData, setFormData] = useState({
    directory_first_name: did.directory_first_name,
    directory_last_name: did.directory_last_name,
    directory_visible: did.directory_visible === "true",
    directory_exten_visible: did.directory_exten_visible === "true",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSave = () => {
    // Convert boolean values back to strings for API
    const apiData = {
      ...formData,
      directory_visible: formData.directory_visible.toString(),
      directory_exten_visible: formData.directory_exten_visible.toString(),
    }

    // Here you would typically call an API to save the changes
    console.log("Saving directory settings:", apiData)
    toast.success("Directory settings saved successfully")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Directory Settings</CardTitle>
        <CardDescription>Configure how this extension appears in the directory</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="directory_first_name">First Name</Label>
            <Input
              id="directory_first_name"
              name="directory_first_name"
              value={formData.directory_first_name}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="directory_last_name">Last Name</Label>
            <Input
              id="directory_last_name"
              name="directory_last_name"
              value={formData.directory_last_name}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="directory_visible"
              checked={formData.directory_visible}
              onCheckedChange={(checked) => handleSwitchChange("directory_visible", checked)}
            />
            <Label htmlFor="directory_visible">Visible in Directory</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="directory_exten_visible"
              checked={formData.directory_exten_visible}
              onCheckedChange={(checked) => handleSwitchChange("directory_exten_visible", checked)}
            />
            <Label htmlFor="directory_exten_visible">Extension Visible in Directory</Label>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save Changes</Button>
      </CardFooter>
    </Card>
  )
}


export function CallerIdCard({ did }: CallerIdCardProps) {
  const [formData, setFormData] = useState({
    effective_caller_id_name: did.effective_caller_id_name,
    effective_caller_id_number: did.effective_caller_id_number,
    outbound_caller_id_name: did.outbound_caller_id_name,
    outbound_caller_id_number: did.outbound_caller_id_number,
    emergency_caller_id_name: did.emergency_caller_id_name,
    emergency_caller_id_number: did.emergency_caller_id_number,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    // Here you would typically call an API to save the changes
    console.log("Saving caller ID settings:", formData)
    toast.success("Caller ID settings saved successfully")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Caller ID Settings</CardTitle>
        <CardDescription>Configure how your caller ID appears to others</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="effective_caller_id_name">Effective Caller ID Name</Label>
            <Input
              id="effective_caller_id_name"
              name="effective_caller_id_name"
              value={formData.effective_caller_id_name}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="effective_caller_id_number">Effective Caller ID Number</Label>
            <Input
              id="effective_caller_id_number"
              name="effective_caller_id_number"
              value={formData.effective_caller_id_number}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="outbound_caller_id_name">Outbound Caller ID Name</Label>
            <Input
              id="outbound_caller_id_name"
              name="outbound_caller_id_name"
              value={formData.outbound_caller_id_name}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="outbound_caller_id_number">Outbound Caller ID Number</Label>
            <Input
              id="outbound_caller_id_number"
              name="outbound_caller_id_number"
              value={formData.outbound_caller_id_number}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_caller_id_name">Emergency Caller ID Name</Label>
            <Input
              id="emergency_caller_id_name"
              name="emergency_caller_id_name"
              value={formData.emergency_caller_id_name}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_caller_id_number">Emergency Caller ID Number</Label>
            <Input
              id="emergency_caller_id_number"
              name="emergency_caller_id_number"
              value={formData.emergency_caller_id_number}
              onChange={handleChange}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save Changes</Button>
      </CardFooter>
    </Card>
  )
}


export function BasicInfoCard({ did }: BasicInfoCardProps) {
  const [formData, setFormData] = useState({
    extension: did.extension,
    number_alias: did.number_alias,
    password: did.password,
    description: did.description,
    disabled: did.disabled,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, disabled: checked }))
  }

  const handleSave = () => {
    // Here you would typically call an API to save the changes
    console.log("Saving basic info:", formData)
    toast.success("Basic information saved successfully")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>Manage the basic settings for this DID</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="extension">Extension</Label>
            <Input id="extension" name="extension" value={formData.extension} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="number_alias">Number Alias</Label>
            <Input
              id="number_alias"
              name="number_alias"
              value={formData.number_alias}
              onChange={handleChange}
              placeholder="Optional"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter a description for this DID"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="disabled" checked={formData.disabled} onCheckedChange={handleSwitchChange} />
          <Label htmlFor="disabled">Disabled</Label>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save Changes</Button>
      </CardFooter>
    </Card>
  )
}
