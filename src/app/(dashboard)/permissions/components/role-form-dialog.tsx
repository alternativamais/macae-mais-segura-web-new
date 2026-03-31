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
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Role } from "@/types/role"
import { roleService } from "@/services/role.service"
import { notificationService as toast } from "@/lib/notifications/notification-service"

import { useTranslator } from "@/lib/i18n"

type RoleFormValues = {
  name: string
  description?: string
}

interface RoleFormDialogProps {
  onRefresh: () => void
  role?: Role
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function RoleFormDialog({ 
  onRefresh, 
  role, 
  open: controlledOpen,
  onOpenChange: setControlledOpen
}: RoleFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen
  const t = useTranslator("permissions.role_form")
  const validationNameMin = t("val_name_min")

  const isEdit = !!role

  const roleFormSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, validationNameMin),
        description: z.string().optional(),
      }),
    [validationNameMin],
  )

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema) as any,
    defaultValues: {
      name: "",
      description: "",
    },
  })

  useEffect(() => {
    if (open) {
      if (role) {
        form.reset({
          name: role.name,
          description: role.description || "",
        })
      } else {
        form.reset({
          name: "",
          description: "",
        })
      }
    }
  }, [open, role, form])

  const onSubmit = async (data: RoleFormValues) => {
    setIsSubmitting(true)
    try {
      if (isEdit && role) {
        await roleService.update(role.id, {
          name: data.name,
          description: data.description || undefined,
        })
        toast.success(t("success_edit"))
      } else {
        await roleService.create({
          name: data.name,
          description: data.description || undefined,
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label_desc")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("placeholder_desc")} 
                      className="resize-none"
                      {...field} 
                    />
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
