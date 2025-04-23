'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@tremor/react';

interface UserSettings {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  extension?: string;
  voicemailPin?: string;
}

export default function UserSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        const response = await fetch(`/api/users/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchUserSettings();
    }
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settings) return;

    try {
      const response = await fetch(`/api/users/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error updating user settings:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!settings) {
    return <div>User not found</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage user settings and permissions
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium leading-none">
                Name
              </label>
              <input
                type="text"
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.name}
                onChange={(e) => setSettings(prev => ({ ...prev!, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                Email
              </label>
              <input
                type="email"
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.email}
                disabled
              />
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                Role
              </label>
              <select
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.role}
                onChange={(e) => setSettings(prev => ({ ...prev!, role: e.target.value as UserSettings['role'] }))}
              >
                <option value="USER">User</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                Extension
              </label>
              <input
                type="text"
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.extension || ''}
                onChange={(e) => setSettings(prev => ({ ...prev!, extension: e.target.value }))}
                placeholder="e.g., 1001"
              />
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                Voicemail PIN
              </label>
              <input
                type="password"
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.voicemailPin || ''}
                onChange={(e) => setSettings(prev => ({ ...prev!, voicemailPin: e.target.value }))}
                placeholder="4-digit PIN"
                maxLength={4}
                pattern="[0-9]{4}"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Save Changes
            </button>
          </div>
        </Card>
      </form>
    </div>
  );
}