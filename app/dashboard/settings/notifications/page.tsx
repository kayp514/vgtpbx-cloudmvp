'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { BellRing, Mail, MessageSquare } from "lucide-react"

interface NotificationSettings {
  missedCallEnabled: boolean;
  missedCallChannels: string[];
  voicemailEnabled: boolean;
  voicemailChannels: string[];
  messageEnabled: boolean;
  messageChannels: string[];
  templates: {
    missedCall: string;
    voicemail: string;
    message: string;
  };
}

const defaultTemplates = {
  missedCall: "You missed a call from {{from}} at {{time}}",
  voicemail: "New voicemail from {{from}} ({{duration}}): {{transcript}}",
  message: "New message from {{from}}: {{message}}"
};

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    missedCallEnabled: true,
    missedCallChannels: ['email'],
    voicemailEnabled: true,
    voicemailChannels: ['email', 'sms'],
    messageEnabled: true,
    messageChannels: ['email'],
    templates: defaultTemplates,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to update settings');

      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Configure how and when you receive notifications.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BellRing className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Missed Calls</CardTitle>
                  <CardDescription>
                    Configure notifications for missed calls
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="missed-calls"
                  checked={settings.missedCallEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, missedCallEnabled: checked }))
                  }
                />
                <Label htmlFor="missed-calls">Enable missed call notifications</Label>
              </div>

              <div className="space-y-2">
                <Label>Notification channels</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="missed-call-email"
                      checked={settings.missedCallChannels.includes('email')}
                      onCheckedChange={(checked) => {
                        const channels = checked 
                          ? [...settings.missedCallChannels, 'email']
                          : settings.missedCallChannels.filter(c => c !== 'email');
                        setSettings(prev => ({ ...prev, missedCallChannels: channels }));
                      }}
                      disabled={!settings.missedCallEnabled}
                    />
                    <Label htmlFor="missed-call-email">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="missed-call-sms"
                      checked={settings.missedCallChannels.includes('sms')}
                      onCheckedChange={(checked) => {
                        const channels = checked 
                          ? [...settings.missedCallChannels, 'sms']
                          : settings.missedCallChannels.filter(c => c !== 'sms');
                        setSettings(prev => ({ ...prev, missedCallChannels: channels }));
                      }}
                      disabled={!settings.missedCallEnabled}
                    />
                    <Label htmlFor="missed-call-sms">SMS</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notification template</Label>
                <Textarea 
                  value={settings.templates.missedCall}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    setSettings(prev => ({
                      ...prev,
                      templates: { ...prev.templates, missedCall: e.target.value }
                    }))
                  }
                  disabled={!settings.missedCallEnabled}
                  placeholder="Template text..."
                  className="h-20"
                />
                <p className="text-sm text-muted-foreground">
                  Available variables: {"{from}"}, {"{to}"}, {"{time}"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Voicemail</CardTitle>
                  <CardDescription>
                    Configure notifications for new voicemails
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="voicemail"
                  checked={settings.voicemailEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, voicemailEnabled: checked }))
                  }
                />
                <Label htmlFor="voicemail">Enable voicemail notifications</Label>
              </div>

              <div className="space-y-2">
                <Label>Notification channels</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="voicemail-email"
                      checked={settings.voicemailChannels.includes('email')}
                      onCheckedChange={(checked) => {
                        const channels = checked 
                          ? [...settings.voicemailChannels, 'email']
                          : settings.voicemailChannels.filter(c => c !== 'email');
                        setSettings(prev => ({ ...prev, voicemailChannels: channels }));
                      }}
                      disabled={!settings.voicemailEnabled}
                    />
                    <Label htmlFor="voicemail-email">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="voicemail-sms"
                      checked={settings.voicemailChannels.includes('sms')}
                      onCheckedChange={(checked) => {
                        const channels = checked 
                          ? [...settings.voicemailChannels, 'sms']
                          : settings.voicemailChannels.filter(c => c !== 'sms');
                        setSettings(prev => ({ ...prev, voicemailChannels: channels }));
                      }}
                      disabled={!settings.voicemailEnabled}
                    />
                    <Label htmlFor="voicemail-sms">SMS</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notification template</Label>
                <Textarea 
                  value={settings.templates.voicemail}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    setSettings(prev => ({
                      ...prev,
                      templates: { ...prev.templates, voicemail: e.target.value }
                    }))
                  }
                  disabled={!settings.voicemailEnabled}
                  placeholder="Template text..."
                  className="h-20"
                />
                <p className="text-sm text-muted-foreground">
                  Available variables: {"{from}"}, {"{duration}"}, {"{transcript}"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Messages</CardTitle>
                  <CardDescription>
                    Configure notifications for new messages
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="messages"
                  checked={settings.messageEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, messageEnabled: checked }))
                  }
                />
                <Label htmlFor="messages">Enable message notifications</Label>
              </div>

              <div className="space-y-2">
                <Label>Notification channels</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="message-email"
                      checked={settings.messageChannels.includes('email')}
                      onCheckedChange={(checked) => {
                        const channels = checked 
                          ? [...settings.messageChannels, 'email']
                          : settings.messageChannels.filter(c => c !== 'email');
                        setSettings(prev => ({ ...prev, messageChannels: channels }));
                      }}
                      disabled={!settings.messageEnabled}
                    />
                    <Label htmlFor="message-email">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="message-sms"
                      checked={settings.messageChannels.includes('sms')}
                      onCheckedChange={(checked) => {
                        const channels = checked 
                          ? [...settings.messageChannels, 'sms']
                          : settings.messageChannels.filter(c => c !== 'sms');
                        setSettings(prev => ({ ...prev, messageChannels: channels }));
                      }}
                      disabled={!settings.messageEnabled}
                    />
                    <Label htmlFor="message-sms">SMS</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notification template</Label>
                <Textarea 
                  value={settings.templates.message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    setSettings(prev => ({
                      ...prev,
                      templates: { ...prev.templates, message: e.target.value }
                    }))
                  }
                  disabled={!settings.messageEnabled}
                  placeholder="Template text..."
                  className="h-20"
                />
                <p className="text-sm text-muted-foreground">
                  Available variables: {"{from}"}, {"{message_text}"}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">Save Changes</Button>
          </div>
        </div>
      </form>
    </div>
  );
}