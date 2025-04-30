"use client"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-layout"
import type { PbxUserDisplay } from "@/lib/db/types"
import {
  ArrowLeft,
  Filter,
  Download,
  Plus, 
  RefreshCw,
  Trash2,
  UserPlus,
  Save,
  Loader2,
  Phone,
  User,
  Bell,
  BellOff,
  Users,
  Shield,
  Settings,
  PhoneForwarded,
  PhoneOff,
  Eye,
  EyeOff,
  Volume2,
} from "lucide-react"

interface ExtensionsHeaderProps {
  selectedCount?: number
}

interface GatewayHeaderProps {
  selectedCount?: number
}

interface SipProfilesHeaderProps {
  selectedCount?: number
}

interface BridgeHeaderProps {
  selectedCount?: number
}

interface UsersHeaderProps {
  selectedCount: number
  onCreateUser: () => void
  onBulkDelete: () => void
}

interface UserEditHeaderProps {
  user: PbxUserDisplay
}

interface TenantHeaderProps {
  selectedCount: number
  onCreateTenant: () => void
  onBulkDelete: () => void
}

interface DomainHeaderProps {
  selectedCount: number
  onCreateDomain: () => void
  onBulkDelete: () => void
}


export function SipProfilesHeader({ selectedCount = 0 }: SipProfilesHeaderProps) {
  return (
    <PageHeader
      title="SIP Profiles"
      description="Manage your FreeSWITCH SIP profiles for internal and external communications"
      actions={
        <>
          {selectedCount > 0 ? (
            <>
              <Button variant="outline" size="sm" className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedCount})
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Selected
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add SIP Profile
              </Button>
            </>
          )}
        </>
      }
    />
  )
}


export function DomainHeader({ selectedCount, onCreateDomain, onBulkDelete }: DomainHeaderProps) {
  return (
    <PageHeader
      title="Domain Management"
      description="Manage domains for your VogatPBX tenants"
      actions={
        <>
          {selectedCount > 0 ? (
            <>
              <Button variant="outline" size="sm" className="text-red-600" onClick={onBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedCount})
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button size="sm" onClick={onCreateDomain}>
                <Plus className="mr-2 h-4 w-4" />
                Add Domain
              </Button>
            </>
          )}
        </>
      }
    />
  )
}

export function TenantHeader({ selectedCount, onCreateTenant, onBulkDelete }: TenantHeaderProps) {
  return (
    <PageHeader
      title="Tenants Management"
      description="Manage your VogatPBX tenants, organizations, and their settings"
      actions={
        <>
          {selectedCount > 0 ? (
            <>
              <Button variant="outline" size="sm" className="text-red-600" onClick={onBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedCount})
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button size="sm" onClick={onCreateTenant}>
                <Plus className="mr-2 h-4 w-4" />
                Add Tenant
              </Button>
            </>
          )}
        </>
      }
    />
  )
}

export function UsersHeader({ selectedCount, onCreateUser, onBulkDelete }: UsersHeaderProps) {
  return (
    <PageHeader
      title="User Management"
      description="Manage system users, roles, and permissions"
      actions={
        <>
          {selectedCount > 0 ? (
            <>
              <Button variant="outline" size="sm" className="text-red-600" onClick={onBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedCount})
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button size="sm" onClick={onCreateUser}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </>
          )}
        </>
      }
    />
  )
}


export function UserEditHeader({ user }: UserEditHeaderProps) {
  return (
    <PageHeader
      title="Edit User"
      description={`Edit settings for ${user.auth_user.displayName}`}
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <a href="/dashboard/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </a>
          </Button>
        </>
      }
    />
  )
}


export function ExtensionsHeader({ selectedCount = 0 }: ExtensionsHeaderProps) {
  return (
    <PageHeader
      title="Extensions"
      description="Manage your PBX extensions, configure settings and control access."
      actions={
        <>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Extension
          </Button>
        </>
      }
    />
  )
}


export function GatewayHeader({ selectedCount = 0 }: GatewayHeaderProps) {
  return (
    <PageHeader
      title="Gateways"
      description="Manage your FreeSWITCH SIP gateways and connections"
      actions={
        <>
          {selectedCount > 0 ? (
            <>
              <Button variant="outline" size="sm" className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedCount})
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Selected
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Gateway
              </Button>
            </>
          )}
        </>
      }
    />
  )
}


export function SipProfilesHeaderOld({ selectedCount = 0 }: SipProfilesHeaderProps) {
  return (
    <PageHeader
      title="SIP Profiles"
      description="Manage your FreeSWITCH SIP profiles for internal and external communications"
      actions={
        <>
          {selectedCount > 0 ? (
            <>
              <Button variant="outline" size="sm" className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedCount})
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Selected
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add SIP Profile
              </Button>
            </>
          )}
        </>
      }
    />
  )
}

export function BridgeHeader({ selectedCount = 0 }: BridgeHeaderProps) {
  return (
    <PageHeader
      title="Bridges"
      description="Manage your FreeSWITCH bridges for connecting different networks"
      actions={
        <>
          {selectedCount > 0 ? (
            <>
              <Button variant="outline" size="sm" className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedCount})
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Selected
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Bridge
              </Button>
            </>
          )}
        </>
      }
    />
  )
}


