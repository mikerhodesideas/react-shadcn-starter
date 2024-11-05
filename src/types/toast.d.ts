import * as React from "react"

export interface ToastProps {
  variant?: "default" | "destructive"
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  onOpenChange?: (open: boolean) => void
}

export type ToastActionElement = React.ReactElement<{
  className?: string
  altText?: string
  onClick?: () => void
}>

export interface ToasterToast extends ToastProps {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
} 