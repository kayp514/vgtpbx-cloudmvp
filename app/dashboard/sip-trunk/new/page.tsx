'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@tremor/react';
import Link from 'next/link';

interface SIPTrunkForm {
  name: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  fromUser?: string;
  fromDomain?: string;
  enabled: boolean;
}

export default function NewSIPTrunkPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SIPTrunkForm>({
    name: '',
    host: '',
    port: 5060,
    enabled: true,
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/sip-trunks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create SIP trunk');
      }

      router.push('/sip-trunk');
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New SIP Trunk</h1>
          <p className="text-sm text-muted-foreground">
            Configure a new SIP trunk connection
          </p>
        </div>
        <Link
          href="/sip-trunk"
          className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium bg-background hover:bg-accent"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          {error && (
            <div className="mb-4 p-4 text-sm text-red-800 rounded-lg bg-red-50">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium leading-none">
                Trunk Name
              </label>
              <input
                type="text"
                required
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Primary SIP Provider"
              />
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                Host
              </label>
              <input
                type="text"
                required
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.host}
                onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                placeholder="e.g., sip.provider.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                Port
              </label>
              <input
                type="number"
                required
                min={1}
                max={65535}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.port}
                onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                Username (Optional)
              </label>
              <input
                type="text"
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.username || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Authentication username"
              />
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                Password (Optional)
              </label>
              <input
                type="password"
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.password || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Authentication password"
              />
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                From User (Optional)
              </label>
              <input
                type="text"
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.fromUser || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, fromUser: e.target.value }))}
                placeholder="SIP From User header"
              />
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                From Domain (Optional)
              </label>
              <input
                type="text"
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.fromDomain || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, fromDomain: e.target.value }))}
                placeholder="SIP From Domain header"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enabled"
                className="h-4 w-4 rounded border-gray-300"
                checked={formData.enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
              />
              <label htmlFor="enabled" className="text-sm font-medium leading-none">
                Enable Trunk
              </label>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Trunk
            </button>
          </div>
        </Card>
      </form>
    </div>
  );
}