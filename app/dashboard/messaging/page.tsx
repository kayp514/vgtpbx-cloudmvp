'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@tremor/react';
import { SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  direction: 'INBOUND' | 'OUTBOUND';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  createdAt: string;
}

interface MessagesResponse {
  messages: Message[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export default function MessagingPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState({
    to: '',
    from: '',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMessages();
  }, [user, page]);

  const fetchMessages = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/messaging?page=${page}`);
      if (response.ok) {
        const data: MessagesResponse = await response.json();
        setMessages(data.messages);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.to || !newMessage.from || !newMessage.message) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/messaging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessage),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Message sent successfully',
        });
        setNewMessage({ to: '', from: '', message: '' });
        fetchMessages();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Messaging</h3>
        <p className="text-sm text-muted-foreground">
          Send and view SMS messages.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                value={newMessage.from}
                onChange={(e) =>
                  setNewMessage((prev) => ({ ...prev, from: e.target.value }))
                }
                placeholder="Enter sender number"
              />
            </div>
            <div>
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                value={newMessage.to}
                onChange={(e) =>
                  setNewMessage((prev) => ({ ...prev, to: e.target.value }))
                }
                placeholder="Enter recipient number"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Input
              id="message"
              value={newMessage.message}
              onChange={(e) =>
                setNewMessage((prev) => ({ ...prev, message: e.target.value }))
              }
              placeholder="Type your message"
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            <SendHorizontal className="mr-2 h-4 w-4" />
            Send Message
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Direction</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.map((message) => (
              <TableRow key={message.id}>
                <TableCell>{message.direction}</TableCell>
                <TableCell>{message.from}</TableCell>
                <TableCell>{message.to}</TableCell>
                <TableCell>{message.body}</TableCell>
                <TableCell>{message.status}</TableCell>
                <TableCell>
                  {new Date(message.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-4 flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
}