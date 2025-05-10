"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Play, Pause, Volume2 } from "lucide-react"
import type { 
  PbxUserDisplay,
  ExtensionDisplay,
  Extension,
  ExtensionUser,
} from "@/lib/db/types"


// Mock hold music options
const holdMusicOptions = [
  { id: "default", name: "Default Music" },
  { id: "classical", name: "Classical" },
  { id: "jazz", name: "Jazz" },
  { id: "pop", name: "Pop" },
  { id: "custom", name: "Custom URL" },
]

// Mock audio URLs - in a real app, these would be actual audio files
const audioUrls: Record<string, string> = {
  default: "https://example.com/default.mp3",
  classical: "https://example.com/classical.mp3",
  jazz: "https://example.com/jazz.mp3",
  pop: "https://example.com/pop.mp3",
}

interface HoldMusicCardProps {
  did: Extension
}


interface CallSettingsCardProps {
  did: Extension
}

export function CallSettingsCard({ did }: CallSettingsCardProps) {
  const [formData, setFormData] = useState({
    limit_max: did.limit_max,
    limit_destination: did.limit_destination,
    missed_call_app: did.missed_call_app,
    missed_call_data: did.missed_call_data,
    toll_allow: did.toll_allow,
    call_timeout: did.call_timeout?.toString(),
    call_group: did.call_group,
    call_screen_enabled: did.call_screen_enabled === "true",
    user_record: did.user_record,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, call_screen_enabled: checked }))
  }

  const handleSave = () => {
    // Convert boolean values back to strings for API
    const apiData = {
      ...formData,
      call_screen_enabled: formData.call_screen_enabled.toString(),
    }

    // Here you would typically call an API to save the changes
    console.log("Saving call settings:", apiData)
    toast.success("Call settings saved successfully")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Settings</CardTitle>
        <CardDescription>Configure call behavior and limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="call_timeout">Call Timeout (seconds)</Label>
            <Input
              id="call_timeout"
              name="call_timeout"
              type="number"
              value={formData.call_timeout}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="call_group">Call Group</Label>
            <Input id="call_group" name="call_group" value={formData.call_group} onChange={handleChange} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="limit_max">Max Calls</Label>
            <Input id="limit_max" name="limit_max" value={formData.limit_max} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="limit_destination">Limit Destination</Label>
            <Input
              id="limit_destination"
              name="limit_destination"
              value={formData.limit_destination}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="toll_allow">Toll Allow</Label>
          <Input
            id="toll_allow"
            name="toll_allow"
            value={formData.toll_allow}
            onChange={handleChange}
            placeholder="e.g., local,domestic,international"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="user_record">Call Recording</Label>
          <Select value={formData.user_record} onValueChange={(value) => handleSelectChange("user_record", value)}>
            <SelectTrigger id="user_record">
              <SelectValue placeholder="Select recording option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Calls</SelectItem>
              <SelectItem value="inbound">Inbound Only</SelectItem>
              <SelectItem value="outbound">Outbound Only</SelectItem>
              <SelectItem value="local">Local Only</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="call_screen_enabled"
            checked={formData.call_screen_enabled}
            onCheckedChange={handleSwitchChange}
          />
          <Label htmlFor="call_screen_enabled">Enable Call Screening</Label>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save Changes</Button>
      </CardFooter>
    </Card>
  )
}


export function HoldMusicCard({ did }: HoldMusicCardProps) {
  const [selectedMusic, setSelectedMusic] = useState(did.hold_music || "default")
  const [customUrl, setCustomUrl] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const isCustom = selectedMusic === "custom"

  const handleMusicChange = (value: string) => {
    setSelectedMusic(value)
    // Stop playback when changing selection
    if (isPlaying) {
      stopPlayback()
    }
  }

  const handleCustomUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomUrl(e.target.value)
    // Stop playback when changing URL
    if (isPlaying) {
      stopPlayback()
    }
  }

  const togglePlayback = () => {
    if (!audioRef.current) {
      // Create audio element if it doesn't exist
      audioRef.current = new Audio(getAudioUrl())
      audioRef.current.onended = () => setIsPlaying(false)
    } else {
      // Update source if it changed
      audioRef.current.src = getAudioUrl()
    }

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error)
        toast.error("Could not play audio. Please check the URL.")
      })
    }

    setIsPlaying(!isPlaying)
  }

  const stopPlayback = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const getAudioUrl = () => {
    if (isCustom) {
      return customUrl
    }
    return audioUrls[selectedMusic] || audioUrls.default
  }

  const handleSave = () => {
    const musicValue = isCustom ? customUrl : selectedMusic

    // Here you would typically call an API to save the changes
    console.log("Saving hold music:", { hold_music: musicValue })
    toast.success("Hold music saved successfully")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hold Music</CardTitle>
        <CardDescription>Configure the music played when calls are placed on hold</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hold_music">Select Music</Label>
          <Select value={selectedMusic} onValueChange={handleMusicChange}>
            <SelectTrigger id="hold_music">
              <SelectValue placeholder="Select hold music" />
            </SelectTrigger>
            <SelectContent>
              {holdMusicOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isCustom && (
          <div className="space-y-2">
            <Label htmlFor="custom_url">Custom URL</Label>
            <Input
              id="custom_url"
              value={customUrl}
              onChange={handleCustomUrlChange}
              placeholder="Enter URL to audio file"
            />
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlayback}
            disabled={isCustom && !customUrl}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <div className="flex items-center gap-1">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{isPlaying ? "Playing..." : "Preview hold music"}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isCustom && !customUrl}>
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  )
}

