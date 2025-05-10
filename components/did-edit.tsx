"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Phone, Forward, Settings, ServerCog, AlertCircle} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PageWrapper } from "@/components/page-layout"
import { 
    SipBypassMediaCard,
    AdvancedSettingsCard,
    DialStringCard 
} from "@/components/ext-did-ui/card-advanced"

import { 
    BasicInfoCard,
    CallerIdCard,
    DirectoryCard,
    DoNotDisturbCard 
} from "@/components/ext-did-ui/card-basic"

import { 
    CallSettingsCard,
    HoldMusicCard 
} from "@/components/ext-did-ui/card-call"

import { 
    ForwardingCard,
    FollowMeCard,
} from "@/components/ext-did-ui/card-forward"
import { DidEditHeader } from "./headers"
import { Extension } from "@/lib/db/types"


interface DIDEditPageProps {
  initialDid: Extension
}

export function DIDEditPage({ initialDid }: DIDEditPageProps) {
  const [did, setDid] = useState<Extension>(initialDid)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()


  const handleGoBack = () => {
    router.back()
  }


  return (
    <PageWrapper>
      <DidEditHeader
        did={did}
        onCancel={handleGoBack}
      />
        <Tabs defaultValue="basic" className="w-full">
        <div className="border-b mb-6">
          <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
            <TabsTrigger
              value="basic"
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none"
            >
              <Phone className="h-4 w-4" />
              <span>Basic</span>
            </TabsTrigger>
            <TabsTrigger
              value="forwarding"
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none"
            >
              <Forward className="h-4 w-4" />
              <span>Forwarding</span>
            </TabsTrigger>
            <TabsTrigger
              value="call-settings"
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none"
            >
              <Settings className="h-4 w-4" />
              <span>Call Settings</span>
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none"
            >
              <ServerCog className="h-4 w-4" />
              <span>Advanced</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="max-w-4xl mx-auto">
          <TabsContent value="basic" className="space-y-6 mt-0">
            <BasicInfoCard did={did} />
            <CallerIdCard did={did} />
            <DirectoryCard did={did} />
            <DoNotDisturbCard did={did} />
          </TabsContent>

          <TabsContent value="forwarding" className="space-y-6 mt-0">
            <ForwardingCard did={did} />
            <FollowMeCard did={did} />
          </TabsContent>

          <TabsContent value="call-settings" className="space-y-6 mt-0">
            <CallSettingsCard did={did} />
            <HoldMusicCard did={did} />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 mt-0">
            <DialStringCard did={did} />
            <SipBypassMediaCard did={did} />
            <AdvancedSettingsCard did={did} />
          </TabsContent>
        </div>
      </Tabs>
    </PageWrapper >
  )
}

function LoadingState() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <Skeleton className="h-9 w-9 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <Skeleton className="h-10 w-full max-w-xl" />
        <div className="border-b mt-2"></div>
      </div>

      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-[300px] w-full rounded-lg" />
        <Skeleton className="h-[250px] w-full rounded-lg" />
      </div>
    </div>
  )
}