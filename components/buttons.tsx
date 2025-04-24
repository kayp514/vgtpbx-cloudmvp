'use client'

import type React from "react"
import { useRouter } from 'next/navigation'
import { Button as ShadcnButton } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileCode, RefreshCw, Shield, Trash2, PlusCircle, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  tooltipText: string
  icon: React.ElementType
}

type ButtonProps = React.ComponentProps<typeof ShadcnButton> & {
  onClick: () => void;
  children: React.ReactNode;
}

export function CreateNewRuleButton() {
  const router = useRouter()
  return (
  <Button onClick={() => router.push("/dashboard/dialplan/inboundrule/new")}>
    <Plus className="mr-2 h-4 w-4" />
    Create Rule
  </Button>
  )}

function CustomButton({ onClick, children, ...props }: ButtonProps) {
  return (
    <ShadcnButton onClick={onClick} {...props}>
      {children}
    </ShadcnButton>
  )
}

export function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <CustomButton onClick={onClick}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Add
    </CustomButton>
  )
}

export function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <CustomButton onClick={onClick} variant="outline">
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </CustomButton>
  )
}

export function AddExtensionButton() {
  const router = useRouter()

  const handleAdd = () => {
    router.push('/dashboard/accounts/extensions/add')
  }

  return (
    <CustomButton onClick={handleAdd}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Add Extension
    </CustomButton>
  )
}

export function DeleteExtensionButton() {
  const handleDelete = () => {
    console.log('Delete selected extensions')
    // Implement delete logic here
  }
  return (
    <CustomButton onClick={handleDelete} variant="outline">
      <Trash2 className="mr-2 h-4 w-4" />
      Delete Extension
    </CustomButton>
  )
}

export function AddBridgeButton({ onClick }: { onClick: () => void }) {
  return (
    <CustomButton onClick={onClick}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Add Bridge
    </CustomButton>
  )
}

export function DeleteBridgeButton({ onClick }: { onClick: () => void }) {
  return (
    <CustomButton onClick={onClick} variant="outline">
      <Trash2 className="mr-2 h-4 w-4" />
      Delete Bridge
    </CustomButton>
  )
}

export function AddGatewayButton({ onClick }: { onClick: () => void }) {
  return (
    <CustomButton onClick={onClick}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Add Gateway
    </CustomButton>
  )
}

export function DeleteGatewayButton({ onClick }: { onClick: () => void }) {
  return (
    <CustomButton onClick={onClick} variant="outline">
      <Trash2 className="mr-2 h-4 w-4" />
      Delete Gateway
    </CustomButton>
  )
}

export function AddAccessControlButton({ onClick }: { onClick: () => void }) {
  return (
    <CustomButton onClick={onClick}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Add Access Control
    </CustomButton>
  )
}


export function SaveButton({ onClick }: { onClick: () => void }) {
  return (
    <CustomButton onClick={onClick}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Save
    </CustomButton>
  )
}



export function ActionButton({
  isLoading = false,
  tooltipText,
  icon: Icon,
  className,
  disabled,
  ...props
}: ActionButtonProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn("h-8 w-8", className)}
            disabled={isLoading || disabled}
            {...props}
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            <span className="sr-only">{tooltipText}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}


export function FlushCacheButton({
  isLoading,
  onClick,
  ...props
}: Omit<ActionButtonProps, "tooltipText" | "icon"> & { onClick?: () => void }) {
  return <ActionButton tooltipText="Flush Cache" icon={Trash2} isLoading={isLoading} onClick={onClick} {...props} />
}


export function ReloadAclButton({
  isLoading,
  onClick,
  ...props
}: Omit<ActionButtonProps, "tooltipText" | "icon"> & { onClick?: () => void }) {
  return <ActionButton tooltipText="Reload ACL" icon={Shield} isLoading={isLoading} onClick={onClick} {...props} />
}

export function ReloadXmlButton({
  isLoading,
  onClick,
  ...props
}: Omit<ActionButtonProps, "tooltipText" | "icon"> & { onClick?: () => void }) {
  return <ActionButton tooltipText="Reload XML" icon={FileCode} isLoading={isLoading} onClick={onClick} {...props} />
}

export function RefreshButton({
  isLoading,
  onClick,
  ...props
}: Omit<ActionButtonProps, "tooltipText" | "icon"> & { onClick?: () => void }) {
  return <ActionButton tooltipText="Refresh" icon={RefreshCw} isLoading={isLoading} onClick={onClick} {...props} />
}

