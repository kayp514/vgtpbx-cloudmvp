'use client';

import { useEffect, useState } from 'react';
import { Card } from '@tremor/react';
import { Plus, PhoneCallIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface SIPTrunk {
  id: string;
  name: string;
  host: string;
  port: number;
  username?: string;
  registered: boolean;
  enabled: boolean;
}

export default function SIPTrunkPage() {
  const [trunks, setTrunks] = useState<SIPTrunk[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrunks = async () => {
      try {
        const response = await fetch('/api/sip-trunks');
        if (response.ok) {
          const data = await response.json();
          setTrunks(data);
        }
      } catch (error) {
        console.error('Error fetching SIP trunks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrunks();
  }, []);

  const handleDeleteTrunk = async (trunkId: string) => {
    if (!confirm('Are you sure you want to delete this SIP trunk?')) {
      return;
    }

    try {
      const response = await fetch(`/api/sip-trunks/${trunkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTrunks(trunks.filter(trunk => trunk.id !== trunkId));
      }
    } catch (error) {
      console.error('Error deleting SIP trunk:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SIP Trunks</h1>
          <p className="text-sm text-muted-foreground">
            Manage SIP trunk connections for outbound calling
          </p>
        </div>
        <Link
          href="/sip-trunk/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add SIP Trunk
        </Link>
      </div>

      <div className="grid gap-6">
        {trunks.length === 0 ? (
          <Card className="p-6">
            <div className="text-center text-sm text-muted-foreground">
              No SIP trunks configured
            </div>
          </Card>
        ) : (
          trunks.map((trunk) => (
            <Card key={trunk.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <PhoneCallIcon className={`h-5 w-5 ${trunk.registered ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{trunk.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {trunk.host}:{trunk.port}
                      {trunk.username && ` (${trunk.username})`}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${trunk.registered ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {trunk.registered ? 'Registered' : 'Not Registered'}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${trunk.enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {trunk.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/sip-trunk/${trunk.id}/settings`}
                    className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    <PhoneCallIcon className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteTrunk(trunk.id)}
                    className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}