"use client"

import { useEffect, useState, useMemo } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Permission } from "@/types/permission"
import { permissionService } from "@/services/permission.service"
import { notificationService as toast } from "@/lib/notifications/notification-service"

import { useTranslator } from "@/lib/i18n"

type PermissionFormValues = {
  name: string
  group?: string
}

interface PermissionFormDialogProps {
  onRefresh: () => void
  permission?: Permission
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function PermissionFormDialog({ 
  onRefresh, 
  permission, 
  open: controlledOpen,
  onOpenChange: setControlledOpen
}: PermissionFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen
  const t = useTranslator("permissions.permission_form")
  const validationNameMin = t("val_name_min")

  const isEdit = !!permission

  const permissionFormSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, validationNameMin),
        group: z.string().optional(),
      }),
    [validationNameMin],
  )

  const form = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionFormSchema) as any,
    defaultValues: {
      name: "",
      group: "",
    },
  })

  useEffect(() => {
    if (open) {
      if (permission) {
        form.reset({
          name: permission.name,
          group: permission.group || "",
        })
      } else {
        form.reset({
          name: "",
          group: "",
        })
      }
    }
  }, [open, permission, form])

  const onSubmit = async (data: PermissionFormValues) => {
    setIsSubmitting(true)
    try {
      if (isEdit && permission) {
        await permissionService.update(permission.id, {
          name: data.name,
          group: data.group || undefined,
        })
        toast.success(t("success_edit"))
      } else {
        await permissionService.create({
          name: data.name,
          group: data.group || undefined,
        })
        toast.success(t("success_new"))
      }
      await onRefresh()
      setOpen(false)
    } catch (error) {
      toast.apiError(error, t("error_save"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("title_edit") : t("title_new")}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("desc_edit")
              : t("desc_new")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label_name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("placeholder_name")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="group"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label_group")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("placeholder_group")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                {t("button_cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("button_save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
