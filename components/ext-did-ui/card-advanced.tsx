"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { InfoIcon as InfoCircle } from "lucide-react"
import type { 
  PbxUserDisplay,
  ExtensionDisplay,
  Extension,
  ExtensionUser,
} from "@/lib/db/types"

interface SipBypassMediaCardProps {
  did: Extension
}

interface DialStringCardProps {
  did: Extension
}

interface AdvancedSettingsCardProps {
  did: Extension
}

const bypassOptions = [
  { value: "false", label: "None" },
  { value: "true", label: "Bypass Media" },
  { value: "bypass-after-bridge", label: "Bypass Media after bridge" },
  { value: "proxy-media", label: "Proxy Media" },
]

export function AdvancedSettingsCard({ did }: AdvancedSettingsCardProps) {
  const [formData, setFormData] = useState({
    auth_acl: did.auth_acl,
    cidr: did.cidr,
    sip_force_contact: did.sip_force_contact,
    sip_force_expires: did.sip_force_expires?.toString(),
    absolute_codec_string: did.absolute_codec_string,
    force_ping: did.force_ping === "true",
    mwi_account: did.mwi_account,
    nibble_account: did.nibble_account?.toString(),
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSave = () => {
    // Convert boolean values back to strings for API
    const apiData = {
      ...formData,
      force_ping: formData.force_ping.toString(),
    }

    // Here you would typically call an API to save the changes
    console.log("Saving advanced settings:", apiData)
    toast.success("Advanced settings saved successfully")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Settings</CardTitle>
        <CardDescription>Configure advanced SIP and system settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="auth_acl">Auth ACL</Label>
            <Input
              id="auth_acl" 
              name="auth_acl" 
              value={formData.auth_acl} 
              onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cidr">CIDR</Label>
            <Input 
              id="cidr" 
              name="cidr" 
              value={formData.cidr} 
              onChange={handleChange} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sip_force_contact">SIP Force Contact</Label>
            <Select
              value={formData.sip_force_contact}
              onValueChange={(value) => handleSelectChange("sip_force_contact", value)}
            >
              <SelectTrigger id="sip_force_contact">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="NDLB-connectile-dysfunction">NDLB-connectile-dysfunction</SelectItem>
                <SelectItem value="NDLB-tls-connectile-dysfunction">NDLB-tls-connectile-dysfunction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sip_force_expires">SIP Force Expires</Label>
            <Input
              id="sip_force_expires"
              name="sip_force_expires"
              type="number"
              value={formData.sip_force_expires}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="absolute_codec_string">Absolute Codec String</Label>
          <Input
            id="absolute_codec_string"
            name="absolute_codec_string"
            value={formData.absolute_codec_string}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mwi_account">MWI Account</Label>
          <Input id="mwi_account" name="mwi_account" value={formData.mwi_account} onChange={handleChange} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="force_ping"
              checked={formData.force_ping}
              onCheckedChange={(checked) => handleSwitchChange("force_ping", checked)}
            />
            <Label htmlFor="force_ping">Force Ping</Label>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save Changes</Button>
      </CardFooter>
    </Card>
  )
}


export function DialStringCard({ did }: DialStringCardProps) {
  const [formData, setFormData] = useState({
    dial_string: did.dial_string,
    dial_user: did.dial_user,
    dial_domain: did.dial_domain,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    // Here you would typically call an API to save the changes
    console.log("Saving dial string settings:", formData)
    toast.success("Dial string settings saved successfully")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dial String Configuration</CardTitle>
        <CardDescription>Configure how calls are routed to this extension</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <Label htmlFor="dial_string" className="text-base font-medium">
              Dial String
            </Label>
            <div className="flex items-center text-xs text-muted-foreground">
              <InfoCircle className="h-3 w-3 mr-1" />
              <span>Advanced setting - use with caution</span>
            </div>
          </div>
          <Textarea
            id="dial_string"
            name="dial_string"
            value={formData.dial_string}
            onChange={handleChange}
            placeholder="Enter custom dial string"
            className="font-mono text-sm"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Custom dial string overrides the default dialing behavior. Leave blank to use system defaults.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="dial_user">Dial User</Label>
            <Input id="dial_user" name="dial_user" value={formData.dial_user} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dial_domain">Dial Domain</Label>
            <Input id="dial_domain" name="dial_domain" value={formData.dial_domain} onChange={handleChange} />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save Changes</Button>
      </CardFooter>
    </Card>
  )
}



export function SipBypassMediaCard({ did }: SipBypassMediaCardProps) {
  // Initialize with the current value or default to "false" (None)
  const [selectedValue, setSelectedValue] = useState(did.sip_bypass_media || "false")

  const handleSave = () => {
    // Here you would typically call an API to save the changes
    console.log("Saving SIP Bypass Media setting:", { sip_bypass_media: selectedValue })
    toast.success("SIP Bypass Media setting saved successfully")
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle>SIP Bypass Media</CardTitle>
        </div>
        <CardDescription>Configure how media is handled for this extension</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sip_bypass_media">Media Handling Mode</Label>
            <Select value={selectedValue} onValueChange={setSelectedValue}>
              <SelectTrigger id="sip_bypass_media" className="w-full">
                <SelectValue placeholder="Select media handling mode" />
              </SelectTrigger>
              <SelectContent>
                {bypassOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md bg-muted p-3 text-sm">
            <h4 className="font-medium mb-2">About SIP Bypass Media</h4>
            <p className="text-muted-foreground">
              {selectedValue === "false" && "Standard mode where media flows through the server."}
              {selectedValue === "true" && "Media flows directly between endpoints, reducing server load and latency."}
              {selectedValue === "bypass-after-bridge" &&
                "Media flows through the server initially, then directly between endpoints after the call is established."}
              {selectedValue === "proxy-media" &&
                "Media is always proxied through the server, useful for transcoding or recording."}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save Changes</Button>
      </CardFooter>
    </Card>
  )
}

