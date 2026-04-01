"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { accessControlService } from "@/services/access-control.service"
import { AccessTrapRoute } from "@/types/access-control"
import { useTranslator } from "@/lib/i18n"
import { Textarea } from "@/components/ui/textarea"

interface TrapRouteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void | Promise<void>
  trapRoute?: AccessTrapRoute
}

export function TrapRouteFormDialog({
  open,
  onOpenChange,
  onSuccess,
  trapRoute,
}: TrapRouteFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEdit = !!trapRoute

  const t = useTranslator("access_control.trap_route_form")

  const formSchema = z.object({
    path: z.string().trim().min(1, t("val_path")),
    method: z.string().trim().default("*"),
    description: z.string().trim().max(255).optional(),
    autoBlock: z.boolean().default(true),
    active: z.boolean().default(true),
  })

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      path: "",
      method: "*",
      description: "",
      autoBlock: true,
      active: true,
    },
  })

  useEffect(() => {
    if (!open) return

    if (trapRoute) {
      form.reset({
        path: trapRoute.path || "",
        method: trapRoute.method || "*",
        description: trapRoute.description || "",
        autoBlock: trapRoute.autoBlock ?? true,
        active: trapRoute.active ?? true,
      })
    } else {
      form.reset({
        path: "",
        method: "*",
        description: "",
        autoBlock: true,
        active: true,
      })
    }
  }, [form, open, trapRoute])

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      if (isEdit && trapRoute) {
        await accessControlService.updateTrapRoute(trapRoute.id, values)
        toast.success(t("success_edit"))
      } else {
        await accessControlService.createTrapRoute(values)
        toast.success(t("success_new"))
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(error, t("error_save"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("title_edit") : t("title_new")}</DialogTitle>
          <DialogDescription>{t("desc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label_path")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("placeholder_path")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("label_method")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("placeholder_method")} {...field} />
                  </FormControl>
                  <FormDescription>{t("method_desc")}</FormDescription>
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

            <div className="flex flex-col gap-4 py-2 sm:flex-row sm:justify-between sm:gap-6">
              <FormField
                control={form.control}
                name="autoBlock"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm sm:w-1/2 flex-1">
                    <div className="space-y-0.5 mr-4">
                      <FormLabel>{t("label_autoblock")}</FormLabel>
                      <FormDescription className="text-[11px] leading-tight mt-1">{t("autoblock_desc")}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm sm:w-1/2 flex-1">
                    <div className="space-y-0.5 mr-4">
                      <FormLabel>{t("label_active")}</FormLabel>
                      <FormDescription className="text-[11px] leading-tight mt-1">{t("active_hint")}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                {t("button_cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t("button_save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
