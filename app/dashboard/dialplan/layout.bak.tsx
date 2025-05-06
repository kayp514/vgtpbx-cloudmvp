import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

export default function DialplanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-none border-b">
        <div className="container py-4">
          <Tabs defaultValue="inbound" className="w-full">
            <TabsList>
              <Link href="/dashboard/dialplan/inbound">
                <TabsTrigger value="inbound">Inbound Rules</TabsTrigger>
              </Link>
              <Link href="/dashboard/dialplan/outbound">
                <TabsTrigger value="outbound">Outbound Rules</TabsTrigger>
              </Link>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
}