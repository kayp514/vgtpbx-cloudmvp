'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface FormState {
  errors?: {
    name?: string[];
    pattern?: string[];
    priority?: string[];
    destinationType?: string[];
    destination?: string[];
  };
  message?: string | null;
}

export default function NewInboundRulePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [destinationType, setDestinationType] = useState('EXTENSION');
  const [formState, setFormState] = useState<FormState>({});

  const validatePattern = (pattern: string) => {
    if (!pattern) return false;

    // Common pattern types based on documentation
    const validPatterns = [
      // Extensions
      /^\d{4}$/,
      // US DID with area code
      /^\+1\(\d{3}\)\d{7}$/,
      // US/Canada numbers with country code
      /^\+1\d{10}$/,
      // Feature codes
      /^\*\d{2}\d*$/,
      // International E.164 format
      /^\+[1-9]\d{6,14}$/,
      // US numbers without +1
      /^[2-9]\d{9}$/,
      // Basic 10-digit numbers
      /^\d{10}$/,
      // UK numbers
      /^\+44\d{10}$/,
      // General pattern with special characters
      /^[\d+*#\[\]()\.\-\\^${}|?]+$/
    ];

    // Check if the pattern matches any of the valid formats
    return validPatterns.some(regex => {
      try {
        // First check if it's one of our predefined patterns
        if (pattern === regex.source) return true;
        
        // Then try to compile and test the pattern itself
        const testRegex = new RegExp(pattern);
        // Validate that the pattern uses only allowed characters
        const allowedCharsRegex = /^[\d+*#\[\]()\.\-\\^${}|?\\]+$/;
        return allowedCharsRegex.test(pattern);
      } catch {
        return false;
      }
    });
  };

  const testPattern = async (pattern: string) => {
    if (!pattern) {
      toast.error('Please enter a pattern first');
      return;
    }

    if (!validatePattern(pattern)) {
      toast.error('Invalid pattern format. Pattern must use valid characters and match one of the supported formats.');
      return;
    }

    try {
      const response = await fetch('/api/dialplan/test-pattern', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pattern }),
      });

      if (!response.ok) throw new Error('Invalid pattern');
      const data = await response.json();
      
      if (data.results) {
        const matchCount = data.results.filter((r: any) => r.matches).length;
        toast.success(`Pattern is valid and matches ${matchCount} test cases`);
      } else {
        toast.success(data.message || 'Pattern is valid');
      }
    } catch (error) {
      toast.error('Invalid pattern format. Please check the pattern syntax.');
    }
  };

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);
    const name = formData.get('name') as string;
    const pattern = formData.get('pattern') as string;
    const priority = parseInt(formData.get('priority') as string);
    const destination = formData.get('destination') as string;

    // Client-side validation
    const errors: FormState['errors'] = {};
    
    if (!name) errors.name = ['Name is required'];
    if (!pattern) errors.pattern = ['Pattern is required'];
    if (!validatePattern(pattern)) errors.pattern = ['Invalid pattern format'];
    if (!priority || priority < 1 || priority > 1000) {
      errors.priority = ['Priority must be between 1 and 1000'];
    }
    if (!destination) errors.destination = ['Destination is required'];

    if (Object.keys(errors).length > 0) {
      setFormState({ errors });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/dialplan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          pattern,
          priority,
          destinationType,
          destination,
          type: 'INBOUND'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create rule');
      }

      toast.success('Inbound rule created successfully');
      router.push('/dashboard/dialplan/inboundrule');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create rule');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">New Inbound Rule</h1>
          <p className="text-muted-foreground">Create a new incoming call routing rule</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/dialplan/inboundrule">Cancel</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Main Office Line"
                aria-describedby="name-error"
              />
              {formState.errors?.name && (
                <p className="text-sm text-red-500" id="name-error">
                  {formState.errors.name[0]}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                A descriptive name for this routing rule
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pattern">Pattern</Label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    id="pattern"
                    name="pattern"
                    placeholder="^\\+1(555)\\d{7}$"
                    aria-describedby="pattern-error"
                  />
                  {formState.errors?.pattern && (
                    <p className="text-sm text-red-500" id="pattern-error">
                      {formState.errors.pattern[0]}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Match incoming DID numbers using regular expressions
                  </p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    const input = document.querySelector('#pattern') as HTMLInputElement;
                    testPattern(input.value);
                  }}
                >
                  Test Pattern
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                name="priority"
                type="number"
                min={1}
                max={1000}
                defaultValue={100}
                aria-describedby="priority-error"
              />
              {formState.errors?.priority && (
                <p className="text-sm text-red-500" id="priority-error">
                  {formState.errors.priority[0]}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Lower numbers have higher priority (1-1000)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Destination Type</Label>
              <Select 
                value={destinationType} 
                onValueChange={setDestinationType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a destination type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXTENSION">Extension</SelectItem>
                  <SelectItem value="RING_GROUP">Ring Group</SelectItem>
                  <SelectItem value="IVR">IVR Menu</SelectItem>
                  <SelectItem value="VOICEMAIL">Voicemail</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Where to route the incoming call
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                name="destination"
                placeholder={
                  destinationType === 'EXTENSION' ? '1001' :
                  destinationType === 'RING_GROUP' ? 'sales_group' :
                  destinationType === 'IVR' ? 'main_menu' :
                  'voicemail_box'
                }
                aria-describedby="destination-error"
              />
              {formState.errors?.destination && (
                <p className="text-sm text-red-500" id="destination-error">
                  {formState.errors.destination[0]}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {destinationType === 'EXTENSION' ? 'Enter extension number' :
                 destinationType === 'RING_GROUP' ? 'Enter ring group ID' :
                 destinationType === 'IVR' ? 'Enter IVR menu ID' :
                 'Enter voicemail box ID'}
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Rule'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}