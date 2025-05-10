"use client"


import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { PlusCircle, Trash2 } from "lucide-react"
import type { 
  PbxUserDisplay,
  ExtensionDisplay,
  Extension,
  ExtensionUser,
} from "@/lib/db/types"

interface ForwardingCardProps {
  did: Extension
}

interface FollowMeCardProps {
  did: Extension
}

export function FollowMeCard({ did }: FollowMeCardProps) {
  // Parse follow_me_destinations if it exists, otherwise use empty array
  const initialDestinations = did.follow_me_destinations
    ? did.follow_me_destinations.split(",").map((dest: string) => ({ number: dest.trim() }))
    : []

  const [formData, setFormData] = useState({
    follow_me_enabled: did.follow_me_enabled === "true",
    follow_me_uuid: did.follow_me_uuid,
    forward_caller_id: did.forward_caller_id,
    destinations: initialDestinations.length > 0 ? initialDestinations : [{ number: "" }],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, follow_me_enabled: checked }))
  }

  const handleDestinationChange = (index: number, value: string) => {
    const newDestinations = [...formData.destinations]
    newDestinations[index] = { number: value }
    setFormData((prev) => ({ ...prev, destinations: newDestinations }))
  }

  const addDestination = () => {
    setFormData((prev) => ({
      ...prev,
      destinations: [...prev.destinations, { number: "" }],
    }))
  }

  const removeDestination = (index: number) => {
    const newDestinations = [...formData.destinations]
    newDestinations.splice(index, 1)
    setFormData((prev) => ({ ...prev, destinations: newDestinations }))
  }

  const handleSave = () => {
    // Convert destinations array to comma-separated string
    const destinationsString = formData.destinations
      .filter((d) => d.number.trim() !== "")
      .map((d) => d.number)
      .join(",")

    // Convert boolean values back to strings for API
    const apiData = {
      ...formData,
      follow_me_enabled: formData.follow_me_enabled.toString(),
      follow_me_destinations: destinationsString,
    }

    // Here you would typically call an API to save the changes
    console.log("Saving follow me settings:", apiData)
    toast.success("Follow Me settings saved successfully")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow Me</CardTitle>
        <CardDescription>Configure follow me settings to ring multiple destinations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch id="follow_me_enabled" checked={formData.follow_me_enabled} onCheckedChange={handleSwitchChange} />
          <Label htmlFor="follow_me_enabled">Enable Follow Me</Label>
        </div>

        {formData.follow_me_enabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="forward_caller_id">Caller ID</Label>
              <Input
                id="forward_caller_id"
                name="forward_caller_id"
                value={formData.forward_caller_id}
                onChange={handleChange}
                placeholder="Optional: Override caller ID for forwarded calls"
              />
            </div>

            <div className="space-y-4">
              <Label>Destinations</Label>
              {formData.destinations.map((dest, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={dest.number}
                    onChange={(e) => handleDestinationChange(index, e.target.value)}
                    placeholder="Enter phone number or extension"
                  />
                  {formData.destinations.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeDestination(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button variant="outline" size="sm" className="mt-2" onClick={addDestination}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Destination
              </Button>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={!formData.follow_me_enabled}>
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  )
}


export function ForwardingCard({ did }: ForwardingCardProps) {
  const [formData, setFormData] = useState({
    forward_all_enabled: did.forward_all_enabled === "true",
    forward_all_destination: did.forward_all_destination,
    forward_busy_enabled: did.forward_busy_enabled === "true",
    forward_busy_destination: did.forward_busy_destination,
    forward_no_answer_enabled: did.forward_no_answer_enabled === "true",
    forward_no_answer_destination: did.forward_no_answer_destination,
    forward_user_not_registered_enabled: did.forward_user_not_registered_enabled === "true",
    forward_user_not_registered_destination: did.forward_user_not_registered_destination,
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
      forward_all_enabled: formData.forward_all_enabled.toString(),
      forward_busy_enabled: formData.forward_busy_enabled.toString(),
      forward_no_answer_enabled: formData.forward_no_answer_enabled.toString(),
      forward_user_not_registered_enabled: formData.forward_user_not_registered_enabled.toString(),
    }

    // Here you would typically call an API to save the changes
    console.log("Saving forwarding settings:", apiData)
    toast.success("Forwarding settings saved successfully")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Forwarding</CardTitle>
        <CardDescription>Configure call forwarding options</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="forward_all_enabled"
              checked={formData.forward_all_enabled}
              onCheckedChange={(checked) => handleSwitchChange("forward_all_enabled", checked)}
            />
            <Label htmlFor="forward_all_enabled">Forward All Calls</Label>
          </div>

          {formData.forward_all_enabled && (
            <div className="pl-6 space-y-2">
              <Label htmlFor="forward_all_destination">Destination</Label>
              <Input
                id="forward_all_destination"
                name="forward_all_destination"
                value={formData.forward_all_destination}
                onChange={handleChange}
                placeholder="Enter destination number or extension"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="forward_busy_enabled"
              checked={formData.forward_busy_enabled}
              onCheckedChange={(checked) => handleSwitchChange("forward_busy_enabled", checked)}
            />
            <Label htmlFor="forward_busy_enabled">Forward When Busy</Label>
          </div>

          {formData.forward_busy_enabled && (
            <div className="pl-6 space-y-2">
              <Label htmlFor="forward_busy_destination">Destination</Label>
              <Input
                id="forward_busy_destination"
                name="forward_busy_destination"
                value={formData.forward_busy_destination}
                onChange={handleChange}
                placeholder="Enter destination number or extension"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="forward_no_answer_enabled"
              checked={formData.forward_no_answer_enabled}
              onCheckedChange={(checked) => handleSwitchChange("forward_no_answer_enabled", checked)}
            />
            <Label htmlFor="forward_no_answer_enabled">Forward No Answer</Label>
          </div>

          {formData.forward_no_answer_enabled && (
            <div className="pl-6 space-y-2">
              <Label htmlFor="forward_no_answer_destination">Destination</Label>
              <Input
                id="forward_no_answer_destination"
                name="forward_no_answer_destination"
                value={formData.forward_no_answer_destination}
                onChange={handleChange}
                placeholder="Enter destination number or extension"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="forward_user_not_registered_enabled"
              checked={formData.forward_user_not_registered_enabled}
              onCheckedChange={(checked) => handleSwitchChange("forward_user_not_registered_enabled", checked)}
            />
            <Label htmlFor="forward_user_not_registered_enabled">Forward When Not Registered</Label>
          </div>

          {formData.forward_user_not_registered_enabled && (
            <div className="pl-6 space-y-2">
              <Label htmlFor="forward_user_not_registered_destination">Destination</Label>
              <Input
                id="forward_user_not_registered_destination"
                name="forward_user_not_registered_destination"
                value={formData.forward_user_not_registered_destination}
                onChange={handleChange}
                placeholder="Enter destination number or extension"
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save Changes</Button>
      </CardFooter>
    </Card>
  )
}
