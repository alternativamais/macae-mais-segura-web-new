import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle, AlertCircle, Trash2 } from "lucide-react"
import { useTranslator } from "@/lib/i18n"

export interface ConfirmDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  children?: React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  icon?: React.ReactNode
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  isLoading = false,
  variant = "destructive",
}: ConfirmDialogProps) {
  const t = useTranslator("shared.confirm_dialog")
  const finalConfirmText = confirmText === "Confirmar" ? t("confirm") : confirmText
  const finalCancelText = cancelText === "Cancelar" ? t("cancel") : cancelText

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    await onConfirm()
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {children ? <div className="mt-4">{children}</div> : null}
        
        <AlertDialogFooter className="mt-8">
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading} className="flex-1">
            {finalCancelText}
          </AlertDialogCancel>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 rounded-lg"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {finalConfirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
