"use client"

import { useTranslator } from "@/lib/i18n"
import { PlateCameraConfigPreset } from "@/types/integration"
import { integrationService } from "@/services/integration.service"
import { useEffect, useState } from "react"
import { notificationService as toast } from "@/lib/notifications/notification-service"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Save, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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

interface PresetManagerProps {
  currentMapping: Record<string, string>
  onLoadPreset: (mapping: Record<string, string>) => void
}

export function PresetManager({
  currentMapping,
  onLoadPreset,
}: PresetManagerProps) {
  const t = useTranslator("plate_sending")

  const [presets, setPresets] = useState<PlateCameraConfigPreset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingDialog, setIsSavingDialog] = useState(false)
  const [isDeletingDialog, setIsDeletingDialog] = useState(false)
  const [newPresetName, setNewPresetName] = useState("")

  const loadPresets = async () => {
    try {
      setIsLoading(true)
      const data = await integrationService.listPresets()
      setPresets(data)
    } catch {
      // Ignorar erros na listagem silenciosamente, presests sao opcionais
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPresets()
  }, [])

  const handleSelect = (id: string) => {
    setSelectedPresetId(id)
    if (!id || id === "none") return
    const preset = presets.find((p) => p.id.toString() === id)
    if (preset && preset.saveMapping) {
      onLoadPreset(preset.saveMapping)
      toast.success(t("studio.cameras.presets.preset_load_success", { name: preset.name }))
    }
  }

  const handleSaveAsPreset = async () => {
    if (!newPresetName.trim()) return

    try {
      setIsLoading(true)
      const data = await integrationService.createPreset({
        name: newPresetName.trim(),
        saveMapping: JSON.stringify(currentMapping),
      })
      
      await loadPresets()
      setSelectedPresetId(data.id.toString())
      setIsSavingDialog(false)
      setNewPresetName("")
      toast.success(t("studio.cameras.presets.preset_save_success"))
    } catch (e) {
      toast.apiError(e, "Erro ao salvar preset.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePreset = async () => {
    if (!selectedPresetId) return

    try {
      setIsLoading(true)
      await integrationService.removePreset(Number(selectedPresetId))
      await loadPresets()
      setSelectedPresetId("")
      setIsDeletingDialog(false)
      toast.success(t("studio.cameras.presets.preset_delete_success"))
    } catch (e) {
      toast.apiError(e, "Erro ao excluir preset.")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPreset = presets.find(p => p.id.toString() === selectedPresetId)

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select
        value={selectedPresetId}
        onValueChange={handleSelect}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full sm:w-[250px] bg-background">
          <SelectValue placeholder={t("studio.cameras.presets.select_placeholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{"--"}</SelectItem>
          {presets.map((preset) => (
            <SelectItem key={preset.id} value={preset.id.toString()}>
              {preset.name}
            </SelectItem>
          ))}
          {presets.length === 0 && (
            <SelectItem value="empty" disabled>
              {t("studio.cameras.presets.empty")}
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        {selectedPresetId && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive h-9 w-9 shrink-0"
            onClick={() => setIsDeletingDialog(true)}
            disabled={isLoading}
            title={t("shared.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          className="h-9 shrink-0 gap-2"
          onClick={() => setIsSavingDialog(true)}
          disabled={isLoading}
        >
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">{t("studio.cameras.presets.save_preset")}</span>
        </Button>
      </div>

      <Dialog open={isSavingDialog} onOpenChange={setIsSavingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("studio.cameras.presets.save_preset")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={t("studio.cameras.presets.preset_name")}
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSavingDialog(false)}>
              {t("management.form.cancel")}
            </Button>
            <Button
              onClick={() => void handleSaveAsPreset()}
              disabled={!newPresetName.trim() || isLoading}
            >
              {t("management.form.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeletingDialog} onOpenChange={setIsDeletingDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("studio.cameras.presets.preset_delete_confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("studio.cameras.presets.preset_delete_description", { name: selectedPreset?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{t("management.form.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={(e) => {
                e.preventDefault()
                void handleDeletePreset()
              }}
              disabled={isLoading}
            >
              {t("shared.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
