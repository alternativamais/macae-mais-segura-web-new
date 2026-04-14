"use client"

import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import { useTranslator } from "@/lib/i18n"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { integrationService } from "@/services/integration.service"
import { Integration } from "@/types/integration"

interface CustomIntegrationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integration: Integration | null
  onSuccess: () => Promise<void> | void
}

const DEFAULT_HEADERS = '{\n  "Content-Type": "application/json"\n}'

const DEFAULT_REQUEST = '{\n  "plate": "",\n  "detectedAt": "",\n  "camera": ""\n}'

export function CustomIntegrationFormDialog({
  open,
  onOpenChange,
  integration,
  onSuccess,
}: CustomIntegrationFormDialogProps) {
  const t = useTranslator("plate_sending")
  const isEditing = Boolean(integration)

  const schema = useMemo(
    () =>
      z.object({
        code: z.string().trim().min(2),
        name: z.string().trim().min(2),
        description: z.string().optional(),
        environmentTag: z.enum(["prod", "dev"]),
        endpointUrl: z.string().trim().min(1),
        httpMethod: z.enum(["POST", "PUT", "PATCH"]),
        headersTemplate: z.string().optional(),
        requestTemplate: z.string().optional(),
        enabled: z.enum(["true", "false"]),
      }),
    [],
  )

  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      environmentTag: "prod",
      endpointUrl: "",
      httpMethod: "POST",
      headersTemplate: DEFAULT_HEADERS,
      requestTemplate: DEFAULT_REQUEST,
      enabled: "true",
    },
  })

  useEffect(() => {
    if (!open) return

    form.reset({
      code: integration?.code || "",
      name: integration?.name || "",
      description: integration?.description || "",
      environmentTag:
        integration?.environmentTag === "dev" ? "dev" : "prod",
      endpointUrl: integration?.endpointUrl || "",
      httpMethod:
        integration?.httpMethod === "PUT" || integration?.httpMethod === "PATCH"
          ? integration.httpMethod
          : "POST",
      headersTemplate: integration?.headersTemplate || DEFAULT_HEADERS,
      requestTemplate: integration?.requestTemplate || DEFAULT_REQUEST,
      enabled: integration?.enabled === false ? "false" : "true",
    })
  }, [form, integration, open])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...(isEditing ? {} : { code: values.code.trim().toLowerCase() }),
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        environmentTag: values.environmentTag,
        endpointUrl: values.endpointUrl.trim(),
        httpMethod: values.httpMethod,
        headersTemplate: values.headersTemplate?.trim() || "{}",
        requestTemplate: values.requestTemplate?.trim() || "{}",
        enabled: values.enabled === "true",
      }

      if (integration) {
        await integrationService.updateIntegration(integration.code, payload)
        toast.success(t("studio.integrations.notifications.edit_success"))
      } else {
        await integrationService.createIntegration(payload)
        toast.success(t("studio.integrations.notifications.create_success"))
      }

      await onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.apiError(
        error,
        integration
          ? t("studio.integrations.notifications.edit_error")
          : t("studio.integrations.notifications.create_error"),
      )
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t("studio.integrations.form.edit_title")
              : t("studio.integrations.form.create_title")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("studio.integrations.form.edit_description")
              : t("studio.integrations.form.create_description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid items-start gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("studio.integrations.form.code")}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isEditing} />
                    </FormControl>
                    <FormDescription>
                      {t("studio.integrations.form.code_help")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("studio.integrations.form.name")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("studio.integrations.form.description")}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid items-start gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="environmentTag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("studio.integrations.form.environment")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="prod">prod</SelectItem>
                        <SelectItem value="dev">dev</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="httpMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("studio.integrations.form.method")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("studio.integrations.form.status")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">{t("statuses.active")}</SelectItem>
                        <SelectItem value="false">{t("statuses.inactive")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="endpointUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("studio.integrations.form.endpoint")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://example.com/webhook" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="headersTemplate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("studio.integrations.form.headers_template")}</FormLabel>
                  <FormDescription>
                    {t("studio.integrations.form.headers_help")}
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      className="font-mono text-xs min-h-[100px] resize-y"
                      spellCheck={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestTemplate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("studio.integrations.form.request_template")}</FormLabel>
                  <FormDescription>
                    {t("studio.integrations.form.request_skeleton_help")}
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      className="font-mono text-xs min-h-[160px] resize-y"
                      spellCheck={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                {t("management.form.cancel")}
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {form.formState.isSubmitting
                  ? t("management.form.saving")
                  : isEditing
                    ? t("management.form.save")
                    : t("studio.integrations.form.create_action")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
