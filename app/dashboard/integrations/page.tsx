'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Webhook, Globe, MessageSquare, BellRing, Slack } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WebhookData {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
}

interface IntegrationData {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  config: Record<string, any>;
}

const eventTypes = [
  { value: 'call.started', label: 'Call Started' },
  { value: 'call.ended', label: 'Call Ended' },
  { value: 'call.missed', label: 'Call Missed' },
  { value: 'voicemail.new', label: 'New Voicemail' },
  { value: 'message.received', label: 'Message Received' },
  { value: 'message.sent', label: 'Message Sent' },
];

export default function IntegrationsPage() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationData[]>([]);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
    enabled: true,
  });
  const { toast } = useToast();

  const handleWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/integrations/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWebhook),
      });

      if (!response.ok) throw new Error('Failed to create webhook');

      const webhook = await response.json();
      setWebhooks([...webhooks, webhook]);
      setNewWebhook({ name: '', url: '', events: [], enabled: true });
      
      toast({
        title: "Webhook created",
        description: "Your webhook has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create webhook. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="apps">App Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Add Webhook</CardTitle>
                <CardDescription>
                  Create a new webhook endpoint for event notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWebhookSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Webhook"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://api.example.com/webhook"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Events</Label>
                    <Select
                      onValueChange={(value) => 
                        setNewWebhook(prev => ({
                          ...prev,
                          events: [...prev.events, value]
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select events" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((event) => (
                          <SelectItem key={event.value} value={event.value}>
                            {event.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newWebhook.events.map((event) => (
                        <Badge
                          key={event}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => 
                            setNewWebhook(prev => ({
                              ...prev,
                              events: prev.events.filter(e => e !== event)
                            }))
                          }
                        >
                          {eventTypes.find(e => e.value === event)?.label}
                          <span className="ml-1">×</span>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enabled"
                      checked={newWebhook.enabled}
                      onCheckedChange={(checked) => 
                        setNewWebhook(prev => ({ ...prev, enabled: checked }))
                      }
                    />
                    <Label htmlFor="enabled">Enable webhook</Label>
                  </div>

                  <Button type="submit" className="w-full">
                    Create Webhook
                  </Button>
                </form>
              </CardContent>
            </Card>

            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{webhook.name}</CardTitle>
                  <Webhook className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground truncate">
                      {webhook.url}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline">
                          {eventTypes.find(e => e.value === event)?.label}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={webhook.enabled ? "default" : "secondary"}>
                        {webhook.enabled ? "Active" : "Inactive"}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        Test
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="apps">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="cursor-pointer hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#4A154B] rounded-lg flex items-center justify-center">
                    <Slack className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Slack</CardTitle>
                    <CardDescription>
                      Send notifications to Slack channels
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Connect
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#464EB8] rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Microsoft Teams</CardTitle>
                    <CardDescription>
                      Send notifications to Teams channels
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Connect
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Custom Integration</CardTitle>
                    <CardDescription>
                      Build your own integration
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Configure
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}