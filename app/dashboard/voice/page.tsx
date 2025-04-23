"use client"

import { useState } from "react"
import { Phone, ArrowUpRight, ArrowDownLeft, VoicemailIcon, PhoneForwarded, Users } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DataTable } from "@/components/data-table"
import { CallRecord, columns } from "@/components/columns"
import { Separator } from "@/components/ui/separator"

const data: CallRecord[] = [
  {
    id: "1",
    direction: "Outbound",
    from: "+1234567890",
    to: "+0987654321",
    duration: "5:23",
    status: "Completed",
    timestamp: "2024-03-20 14:30:00",
  },
  {
    id: "2",
    direction: "Inbound",
    from: "+0987654321",
    to: "+1234567890",
    duration: "2:45",
    status: "Voicemail",
    timestamp: "2024-03-20 13:15:00",
  },
]

export default function VoicePage() {
  const [forwardingEnabled, setForwardingEnabled] = useState(false)
  const [voicemailEnabled, setVoicemailEnabled] = useState(true)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Voice Calls</h1>
        <Button>
          New Call Rule
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">245</div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">+12%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outbound</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">145</div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">+5%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inbound</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">100</div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">+8%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">3:45</div>
              <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">-2%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Call History</TabsTrigger>
          <TabsTrigger value="settings">Voice Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Call History</CardTitle>
              <CardDescription>
                View and manage all voice calls in your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={data} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>Call Forwarding</CardTitle>
                    <CardDescription>
                      Forward calls when you're unavailable
                    </CardDescription>
                  </div>
                  <Switch
                    checked={forwardingEnabled}
                    onCheckedChange={setForwardingEnabled}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forward-to">Forward calls to</Label>
                  <Input
                    id="forward-to"
                    placeholder="Enter phone number"
                    disabled={!forwardingEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Forward when</Label>
                  <Select disabled={!forwardingEnabled}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="busy">When busy</SelectItem>
                      <SelectItem value="no-answer">No answer</SelectItem>
                      <SelectItem value="always">Always</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>Voicemail Settings</CardTitle>
                    <CardDescription>
                      Configure your voicemail preferences
                    </CardDescription>
                  </div>
                  <Switch
                    checked={voicemailEnabled}
                    onCheckedChange={setVoicemailEnabled}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="greeting">Greeting Message</Label>
                  <Select disabled={!voicemailEnabled}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select greeting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Greeting</SelectItem>
                      <SelectItem value="custom">Custom Recording</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pin">Voicemail PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="Enter PIN"
                    disabled={!voicemailEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Notifications</Label>
                  <div className="flex items-center space-x-2">
                    <Switch id="email" disabled={!voicemailEnabled} />
                    <Label htmlFor="email">Send voicemail to email</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Call Routing</CardTitle>
                <CardDescription>
                  Configure how incoming calls are handled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Ring Strategy</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ring strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simultaneous">Ring All</SelectItem>
                      <SelectItem value="sequential">Sequential</SelectItem>
                      <SelectItem value="round-robin">Round Robin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ring Timeout (seconds)</Label>
                  <Input type="number" min="5" max="120" defaultValue="30" />
                </div>
                <Separator />
                <div className="pt-4">
                  <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Call Groups
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}