'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface InboundRule {
  id: string;
  name: string;
  pattern: string;
  priority: number;
  destinationType: 'EXTENSION' | 'RING_GROUP' | 'IVR' | 'VOICEMAIL';
  destination: string;
  status: 'active' | 'inactive';
}

export default function InboundRulesPage() {
  const [rules, setRules] = useState<InboundRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/dialplan?type=INBOUND');
      if (!response.ok) throw new Error('Failed to fetch rules');
      const data = await response.json();
      setRules(data);
    } catch (error) {
      toast.error('Failed to load inbound rules');
    } finally {
      setLoading(false);
    }
  };

  const handleTestRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/dialplan/${ruleId}/test`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Test failed');
      const result = await response.json();
      toast.success(`Test successful: ${result.message}`);
    } catch (error) {
      toast.error('Failed to test rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const response = await fetch(`/api/dialplan/${ruleId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete rule');
      toast.success('Rule deleted successfully');
      fetchRules();
    } catch (error) {
      toast.error('Failed to delete rule');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inbound Rules</h1>
          <p className="text-muted-foreground">Manage incoming call routing rules</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/dialplan/inboundrule/new">Create Rule</Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48">
            <p className="text-muted-foreground mb-4">No inbound rules found</p>
            <Button asChild variant="outline">
              <Link href="/dashboard/dialplan/inboundrule/new">Create your first rule</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {rule.name}
                      <Badge variant={rule.status === 'active' ? 'success' : 'secondary'}>
                        {rule.status}
                      </Badge>
                    </CardTitle>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p><strong>Pattern:</strong> {rule.pattern}</p>
                      <p><strong>Priority:</strong> {rule.priority}</p>
                      <p><strong>Routes to:</strong> {rule.destinationType} ({rule.destination})</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleTestRule(rule.id)}>
                      Test
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/dialplan/inbound/${rule.id}`}>Edit</Link>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}