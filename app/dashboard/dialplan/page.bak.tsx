'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Title, Tab, TabList, TabGroup, TabPanel, TabPanels } from '@tremor/react';

interface DialplanRule {
  id: string;
  name: string;
  pattern: string;
  priority: number;
  type: 'INBOUND' | 'OUTBOUND';
  destinationType?: 'EXTENSION' | 'RING_GROUP' | 'IVR' | 'VOICEMAIL';
  destination?: string;
  sipTrunkId?: string;
  sipTrunkName?: string;
  stripDigits?: number;
  prefix?: string;
}

export default function DialplanPage() {
  const [rules, setRules] = useState<DialplanRule[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/dialplan');
      if (!response.ok) {
        throw new Error('Failed to fetch dialplan rules');
      }
      const data = await response.json();
      setRules(data);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/dialplan/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete rule');
      }

      await fetchRules();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const inboundRules = rules.filter(rule => rule.type === 'INBOUND');
  const outboundRules = rules.filter(rule => rule.type === 'OUTBOUND');

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dialplan Rules</h1>
          <p className="text-sm text-muted-foreground">
            Manage your inbound and outbound call routing rules
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50">
          {error}
        </div>
      )}

      <TabGroup>
        <TabList>
          <Tab>Inbound Rules</Tab>
          <Tab>Outbound Rules</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <div className="flex justify-end mb-4">
              <Link
                href="/dialplan/inbound/new"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Add Inbound Rule
              </Link>
            </div>

            <div className="space-y-4">
              {inboundRules.map((rule) => (
                <Card key={rule.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Title>{rule.name}</Title>
                      <div className="mt-2 space-y-1 text-sm">
                        <p><strong>Pattern:</strong> {rule.pattern}</p>
                        <p><strong>Priority:</strong> {rule.priority}</p>
                        <p><strong>Destination:</strong> {rule.destinationType} ({rule.destination})</p>
                      </div>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabPanel>

          <TabPanel>
            <div className="flex justify-end mb-4">
              <Link
                href="/dialplan/outbound/new"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Add Outbound Rule
              </Link>
            </div>

            <div className="space-y-4">
              {outboundRules.map((rule) => (
                <Card key={rule.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Title>{rule.name}</Title>
                      <div className="mt-2 space-y-1 text-sm">
                        <p><strong>Pattern:</strong> {rule.pattern}</p>
                        <p><strong>Priority:</strong> {rule.priority}</p>
                        <p><strong>SIP Trunk:</strong> {rule.sipTrunkName}</p>
                        {rule.stripDigits !== undefined && (
                          <p><strong>Strip Digits:</strong> {rule.stripDigits}</p>
                        )}
                        {rule.prefix && (
                          <p><strong>Prefix:</strong> {rule.prefix}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}