import type React from "react"
import {
  BarChart3,
  Cog,
  FileText,
  Home,
  MessageSquare,
  Network,
  Phone,
  PhoneCall,
  Users,
  GitFork,
  Voicemail,
  Building2,
  CreditCard,
  Shield,
  Clock,
} from "lucide-react"
import type { UserRole } from "@/lib/db/types"

export type NavItem = {
  name: string
  href?: string
  icon: React.ElementType
  hasSubmenu?: boolean
  submenu?: NavItem[]
  section?: string
  roles?: UserRole[]
  permission?: string
}

export const navigation: NavItem[] = [
  // Overview Section - No submenu
  {
    name: "Overview",
    href: "/dashboard",
    icon: Home,
    section: "overview",
    roles: ["admin", "superuser", "member"],
  },

  // Users Section
  {
    name: "Users",
    icon: Users,
    hasSubmenu: true,
    section: "users",
    roles: ["admin", "superuser", "member"],
    submenu: [
      {
        name: "All Users",
        href: "/dashboard/users",
        icon: Users,
        roles: ["admin", "superuser", "member"],
        permission: "users.view",
      },
      {
        name: "User Groups",
        href: "/dashboard/users/groups",
        icon: Users,
        roles: ["admin", "superuser"],
        permission: "user_groups.view",
      },
      {
        name: "Permissions",
        href: "/dashboard/users/permissions",
        icon: Users,
        roles: ["admin", "superuser"],
        permission: "permissions.view",
      },
    ],
  },

  // Dialplan Section
  {
    name: "Dialplan",
    icon: GitFork,
    hasSubmenu: true,
    section: "dialplan",
    roles: ["admin", "superuser"],
    submenu: [
      {
        name: "Inbound Rules",
        href: "/dashboard/dialplan/inboundrule",
        icon: FileText,
        roles: ["admin", "superuser"],
        permission: "dialplan.inbound",
      },
      {
        name: "Outbound Rules",
        href: "/dashboard/dialplan/outboundrule",
        icon: FileText,
        roles: ["admin", "superuser"],
        permission: "dialplan.outbound",
      },
    ],
  },

  // Voice Section
  {
    name: "Voice",
    icon: Phone,
    hasSubmenu: true,
    section: "voice",
    roles: ["admin", "superuser", "member"],
    submenu: [
      {
        name: "Ring Groups",
        href: "/dashboard/voice/ring-groups",
        icon: Users,
        roles: ["admin", "superuser", "member"],
        permission: "voice.ring_groups",
      },
      {
        name: "Call Queues",
        href: "/dashboard/voice/queues",
        icon: PhoneCall,
        roles: ["admin", "superuser", "member"],
        permission: "voice.queues",
      },
      {
        name: "Time Conditions",
        href: "/dashboard/voice/time-conditions",
        icon: Clock,
        roles: ["admin", "superuser"],
        permission: "voice.time_conditions",
      },
      {
        name: "IVR Menus",
        href: "/dashboard/voice/ivr",
        icon: GitFork,
        roles: ["admin", "superuser"],
        permission: "voice.ivr",
      },
      {
        name: "Voicemail",
        href: "/dashboard/voice/voicemail",
        icon: Voicemail,
        roles: ["admin", "superuser", "member"],
        permission: "voice.voicemail",
      },
    ],
  },

  // Messaging Section
  {
    name: "Messaging",
    icon: MessageSquare,
    hasSubmenu: true,
    section: "messaging",
    roles: ["admin", "superuser", "member"],
    submenu: [
      {
        name: "SMS",
        href: "/dashboard/messaging/sms",
        icon: MessageSquare,
        roles: ["admin", "superuser", "member"],
        permission: "messaging.sms",
      },
      {
        name: "Chat",
        href: "/dashboard/messaging/chat",
        icon: MessageSquare,
        roles: ["admin", "superuser", "member"],
        permission: "messaging.chat",
      },
      {
        name: "Templates",
        href: "/dashboard/messaging/templates",
        icon: MessageSquare,
        roles: ["admin", "superuser"],
        permission: "messaging.templates",
      },
    ],
  },

  // SIP Trunks Section
  {
    name: "SIP Trunks",
    icon: Network,
    hasSubmenu: true,
    section: "siptrunks",
    roles: ["admin", "superuser"],
    submenu: [
      {
        name: "Rules",
        href: "/dashboard/siptrunks/rules",
        icon: Shield,
        roles: ["admin", "superuser"],
        permission: "siptrunks.rules",
      },
      {
        name: "Gateways",
        href: "/dashboard/siptrunks/gateways",
        icon: Network,
        roles: ["admin", "superuser"],
        permission: "siptrunks.gateways",
      },
    ],
  },

  // Reports Section
  {
    name: "Reports",
    icon: BarChart3,
    hasSubmenu: true,
    section: "reports",
    roles: ["admin", "superuser", "member"],
    submenu: [
      {
        name: "Call History",
        href: "/dashboard/reports/call-history",
        icon: BarChart3,
        roles: ["admin", "superuser", "member"],
        permission: "reports.call_history",
      },
      {
        name: "Call Analytics",
        href: "/dashboard/reports/analytics",
        icon: BarChart3,
        roles: ["admin", "superuser"],
        permission: "reports.analytics",
      },
      {
        name: "Usage Reports",
        href: "/dashboard/reports/usage",
        icon: BarChart3,
        roles: ["admin", "superuser"],
        permission: "reports.usage",
      },
    ],
  },

  // Settings Section
  {
    name: "Settings",
    icon: Cog,
    hasSubmenu: true,
    section: "settings",
    roles: ["admin", "superuser"],
    submenu: [
      {
        name: "Account",
        href: "/dashboard/settings/account",
        icon: Building2,
        roles: ["admin", "superuser"],
        permission: "settings.account",
      },
      {
        name: "Billing",
        href: "/dashboard/settings/billing",
        icon: CreditCard,
        roles: ["admin", "superuser"],
        permission: "settings.billing",
      },
    ],
  },
]
