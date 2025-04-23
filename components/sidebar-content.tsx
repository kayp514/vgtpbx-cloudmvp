"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { ChevronRight, PanelLeft, PanelRightClose, SwitchCamera } from "lucide-react"
import {
  Sidebar,
  SidebarContent as SidebarContentPrimitive,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { navigation } from "@/lib/navigation"
import { useAuth } from "@tern-secure/nextjs"
import { cn } from "@/lib/utils"

import { SidebarUserFooter } from "@/components/sidebarfooter"


export function SidebarContent() {
    const pathname = usePathname()
    const { user, signOut } = useAuth()
    const { state: sidebarState, toggleSidebar } = useSidebar()
    const isCollapsed = sidebarState === "collapsed"
  
    const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
      overview: true,
      users: true,
      dialplan: true,
      voice: true,
      messaging: true,
      siptrunks: true,
      reports: true,
      settings: true,
    })
  
    const toggleSection = (section: string) => {
      setExpandedSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }))
    }

    const handleSignOut = () => {
      return signOut()
    }
  
  
  
    // Group navigation items by section
    const overviewItem = navigation.filter((item) => item.section === "overview")
    const usersItems = navigation.filter((item) => item.section === "users")
    const dialplanItems = navigation.filter((item) => item.section === "dialplan")
    const voiceItems = navigation.filter((item) => item.section === "voice")
    const messagingItems = navigation.filter((item) => item.section === "messaging")
    const siptrunksItems = navigation.filter((item) => item.section === "siptrunks")
    const reportsItems = navigation.filter((item) => item.section === "reports")
    const settingsItems = navigation.filter((item) => item.section === "settings")
  
    // Check if a path is active
    const isActive = (href: string) => pathname === href
  
    // Check if a section is active (any of its items is active)
    const isActiveSection = (href: string) => {
      if (href === "/dashboard") {
        return pathname === "/dashboard"
      }
      return pathname.startsWith(href)
    }
  
    const renderSection = (sectionItems: typeof navigation, sectionKey: string) => {
      if (sectionItems.length === 0) return null
  
      const sectionData = sectionItems[0]
      const isExpanded = expandedSections[sectionKey]
  
      const hasActiveItem = sectionItems.some((item) =>
        item.submenu?.some((subItem) => subItem.href && isActiveSection(subItem.href)),
      )
  
      return (
        <div
          key={sectionKey}
          className={cn(
            "mb-1",
            isCollapsed ? "px-0.5" : "px-1",
          )}
        >
          <Button
            onClick={() => toggleSection(sectionKey)}
            variant="ghost"
            size="sm"
            className={cn(
              "w-full flex items-center justify-between py-1.5 px-2 h-auto",
              "hover:bg-muted/50 rounded-md transition-colors duration-200",
              hasActiveItem && "text-primary font-medium",
              isCollapsed && "justify-center px-0",
            )}
          >
            <div className={cn("flex items-center gap-2", isCollapsed && "justify-center w-full")}>
              <div
                className={cn(
                  "flex items-center justify-center",
                  hasActiveItem ? "text-primary" : "text-muted-foreground/80",
                )}
              >
                <sectionData.icon className="h-4 w-4" />
              </div>
              {!isCollapsed && <span className="text-sm font-medium">{sectionData.name}</span>}
            </div>
            {!isCollapsed && (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-muted-foreground/70"
              >
                <ChevronRight className="h-4 w-4" />
              </motion.div>
            )}
          </Button>
  
          {/* Section Content */}
          <motion.div
            initial={false}
            animate={{
              height: isExpanded || isCollapsed ? "auto" : 0,
              opacity: isExpanded || isCollapsed ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
            className={cn(
              "overflow-hidden",
              !isCollapsed && isExpanded && "mt-1 ml-3",
              !isCollapsed && isExpanded && "border-l border-muted-foreground/10",
            )}
          >
            <div
              className={cn(
                "flex flex-col gap-0.5", 
                !isCollapsed && "pl-2 pr-1",
              )}
            >
              {sectionItems.flatMap((item) =>
                item.submenu?.map((subItem) => (
                  <TooltipProvider key={subItem.name} delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={subItem.href || "#"}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm",
                            "transition-colors duration-200",
                            "hover:bg-muted/50",
                            isActive(subItem.href || "") && "bg-primary/10 text-primary font-medium",
                            isCollapsed && "justify-center p-1.5", 
                          )}
                        >
                          <subItem.icon
                            className={cn(
                              "h-4 w-4",
                              isActive(subItem.href || "") ? "text-primary" : "text-muted-foreground",
                            )}
                          />
                          {!isCollapsed && <span>{subItem.name}</span>}
                        </Link>
                      </TooltipTrigger>
                      {isCollapsed && <TooltipContent side="right">{subItem.name}</TooltipContent>}
                    </Tooltip>
                  </TooltipProvider>
                )),
              )}
            </div>
          </motion.div>
        </div>
      )
    }
  
    return (
      <Sidebar className="border-r shadow-sm bg-gradient-to-b from-background to-muted/20 h-screen transition-all duration-300 ease-in-out">
        <SidebarHeader className="border-b border-border/60">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20">
                <SwitchCamera className="h-5 w-5" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-tight">VogatPBX</span>
                  <span className="text-xs text-muted-foreground">Cloud PBX</span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted/50"
              onClick={toggleSidebar}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
            </Button>
          </div>
        </SidebarHeader>
  
        <SidebarContentPrimitive
          className={cn(
            "py-3 overflow-y-auto overflow-x-hidden",
            "scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent",
            "transition-all duration-200 ease-in-out",
            isCollapsed ? "px-1" : "px-2", 
          )}
        >


        {/* Overview section - special handling for no submenu */}
        {overviewItem && (
          <div className={cn("mb-1", isCollapsed ? "px-0.5" : "px-1")}>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={overviewItem[0].href || "#"}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm",
                      "transition-colors duration-200",
                      "hover:bg-muted/50",
                      isActive(overviewItem[0]?.href || "") && "bg-primary/10 text-primary font-medium",
                      isCollapsed && "justify-center p-1.5",
                    )}
                  >
                    {React.createElement(overviewItem[0].icon, {
                      className: cn(
                        "h-4 w-4",
                        isActive(overviewItem[0].href || "") ? "text-primary" : "text-muted-foreground",
                      )
                    })}
                    {!isCollapsed && <span>{overviewItem[0].name}</span>}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right">{overviewItem[0].name}</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
  
          {/* Render each section with consistent spacing */}
          <div className="space-y-2">
            {/* Consistent spacing between section groups */}
            {renderSection(usersItems, "users")}
            {renderSection(dialplanItems, "dialplan")}
            {renderSection(voiceItems, "voice")}
            {renderSection(messagingItems, "messaging")}
            {renderSection(siptrunksItems, "siptrunks")}
            {renderSection(reportsItems, "reports")}
            {renderSection(settingsItems, "settings")}
          </div>
        </SidebarContentPrimitive>
  
        <SidebarFooter className="border-t bg-gradient-to-b from-muted/10 to-muted/30">
          {user && (
            <SidebarUserFooter
              user={{
                id: user.uid,
                name: user.displayName || user.email || "User",
                email: user.email || '',
                role: "admin",
              }}
              onLogout={handleSignOut}
            />
          )}
        </SidebarFooter>
      </Sidebar>
    )
  }