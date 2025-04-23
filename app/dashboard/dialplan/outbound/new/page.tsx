'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@tremor/react';
import Link from 'next/link';

interface SIPTrunk {
  id: string;
  name: string;
  host: string;
}

interface OutboundRuleForm {
  name: string;
  pattern: string;
  priority: number;
  sipTrunkId: string;
  stripDigits?: number;
  prefix?: string;
}

export default function NewOutboundRulePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<OutboundRuleForm>({
    name: '',
    pattern: '',
    priority: 100,
    sipTrunkId: '',
  });
  const [error, setError] = useState('');
  const [trunks, setTrunks] = useState<SIPTrunk[]>([]);

  useEffect(() => {
    const fetchTrunks = async () => {
      try {
        const response = await fetch('/api/sip-trunks');
        if (response.ok) {
          const data = await response.json();
          setTrunks(data);
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, sipTrunkId: data[0].id }));
          }
        }
      } catch (error) {
        console.error('Error fetching SIP trunks:', error);
      }
    };

    fetchTrunks();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/dialplan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          type: 'OUTBOUND',
          stripDigits: formData.stripDigits || undefined,
          prefix: formData.prefix || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create outbound rule');
      }

      router.push('/dialplan');
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Outbound Rule</h1>
          <p className="text-sm text-muted-foreground">
            Configure how outgoing calls are routed through SIP trunks
          </p>
        </div>
        <Link
          href="/dialplan"
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
                Rule Name
              </label>
              <input
                type="text"
                required
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Local Calls"
              />
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                Pattern
              </label>
              <input
                type="text"
                required
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.pattern}
                onChange={(e) => setFormData(prev => ({ ...prev, pattern: e.target.value }))}
                placeholder="e.g., ^\\+1(\\d{3})(\\d{7})$"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Regular expression pattern to match dialed numbers
              </p>
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                Priority
              </label>
              <input
                type="number"
                required
                min={1}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Lower numbers have higher priority
              </p>
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                SIP Trunk
              </label>
              <select
                required
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.sipTrunkId}
                onChange={(e) => setFormData(prev => ({ ...prev, sipTrunkId: e.target.value }))}
              >
                {trunks.map((trunk) => (
                  <option key={trunk.id} value={trunk.id}>
                    {trunk.name} ({trunk.host})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                Strip Digits (Optional)
              </label>
              <input
                type="number"
                min={0}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.stripDigits || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, stripDigits: e.target.value ? parseInt(e.target.value) : undefined }))}
                placeholder="Number of digits to strip from the start"
              />
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                Prefix (Optional)
              </label>
              <input
                type="text"
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.prefix || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, prefix: e.target.value }))}
                placeholder="Digits to add to the start"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Rule
            </button>
          </div>
        </Card>
      </form>
    </div>
  );
}