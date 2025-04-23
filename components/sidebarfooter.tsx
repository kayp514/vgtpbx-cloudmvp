"use client"
import { ChevronRight, LogOut, Settings, User, HelpCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarFooter } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"
import { toast } from "sonner"


export interface UserData {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string
}

interface SidebarFooterProps {
  user: UserData
  onLogout?: () => void
  onProfileClick?: () => void
  onSettingsClick?: () => void
  onHelpClick?: () => void
  className?: string
}

export function SidebarUserFooter({
  user,
  onLogout,
  onProfileClick,
  onSettingsClick,
  onHelpClick,
  className,
}: SidebarFooterProps) {
  const { state: sidebarState } = useSidebar()
  const isCollapsed = sidebarState === "collapsed"

  // Default handlers if not provided
  const handleLogout = () => {
    onLogout?.() || toast.error("Logout function not provided")
  }

  const handleProfileClick = () => {
    onProfileClick?.() || console.log("Profile clicked")
  }

  const handleSettingsClick = () => {
    onSettingsClick?.() || console.log("Settings clicked")
  }

  const handleHelpClick = () => {
    onHelpClick?.() || console.log("Help clicked")
  }

  if (!user) return null

  return (
    <SidebarFooter className={cn("border-t bg-gradient-to-b from-muted/10 to-muted/30", className)}>
      <div className={cn("p-2", isCollapsed && "p-1.5")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {isCollapsed ? (
              <Button
                variant="ghost"
                className="w-full h-8 p-0 rounded-full hover:bg-muted/50 transition-all duration-200"
              >
                <Avatar className="h-7 w-7 border border-primary/10 shadow-sm">
                  <AvatarImage src={user.avatarUrl || "/placeholder-user.jpg"} alt={user.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-between items-center h-auto py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-all duration-200 group"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7 border border-primary/10 shadow-sm transition-all duration-200 group-hover:ring-primary/5">
                    <AvatarImage src={user.avatarUrl || "/placeholder-user.jpg"} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium text-xs leading-tight">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px] leading-tight">
                      {user.email}
                    </span>
                  </div>
                </div>
                <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                </div>
              </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex flex-col">
                <span className="font-medium text-sm">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
              <div className="flex items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.5">
                <span className="text-xs font-medium text-primary capitalize">{user.role}</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2 py-1.5 cursor-pointer" onClick={handleProfileClick}>
              <User className="h-3.5 w-3.5" />
              <span className="text-sm">Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 py-1.5 cursor-pointer" onClick={handleSettingsClick}>
              <Settings className="h-3.5 w-3.5" />
              <span className="text-sm">Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 py-1.5 cursor-pointer" onClick={handleHelpClick}>
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="text-sm">Help & Support</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 py-1.5 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="text-sm">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </SidebarFooter>
  )
}

