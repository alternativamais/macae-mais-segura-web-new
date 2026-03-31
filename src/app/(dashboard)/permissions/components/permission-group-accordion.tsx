"use client"

import { useState } from "react"
import { Permission } from "@/types/permission"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion"
import { ChevronDown, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslator } from "@/lib/i18n"

interface PermissionGroupAccordionProps {
  groupName: string
  permissions: Permission[]
  assignedIds: number[]
  onToggleGroup: (groupPermissions: Permission[], isChecked: boolean) => void
  onTogglePermission: (permissionId: number, isChecked: boolean) => void
}

export function PermissionGroupAccordion({
  groupName,
  permissions,
  assignedIds,
  onToggleGroup,
  onTogglePermission,
}: PermissionGroupAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslator("permissions.assignment_tab")
  const allChecked = permissions.every((p) => assignedIds.includes(p.id))
  const someChecked = permissions.some((p) => assignedIds.includes(p.id)) && !allChecked

  const toggleOpen = () => {
    setIsOpen((current) => !current)
  }

  return (
    <Accordion
      type="single"
      collapsible
      value={isOpen ? groupName : undefined}
      onValueChange={(value) => setIsOpen(value === groupName)}
      className="w-full"
    >
      <AccordionItem value={groupName} className="border-b-0">
        <div
          role="button"
          tabIndex={0}
          onClick={toggleOpen}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              toggleOpen()
            }
          }}
          className="flex cursor-pointer items-center gap-4 px-4 py-3 transition-all hover:bg-muted/50"
        >
          <div
            className="flex items-center"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Checkbox
              checked={allChecked ? true : someChecked ? "indeterminate" : false}
              onCheckedChange={(checked) => onToggleGroup(permissions, !!checked)}
              id={`group-${groupName}`}
            />
          </div>

          <div className="flex flex-1 items-center gap-2 pr-4 text-left">
            <ShieldAlert className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-semibold leading-none">
              {groupName || t("fallback_group")}
            </span>
          </div>

          <div className="shrink-0 text-xs font-normal text-muted-foreground">
            {t("selection_count", {
              selected: permissions.filter((p) => assignedIds.includes(p.id)).length,
              total: permissions.length,
            })}
          </div>

          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>

        <AccordionContent className="border-t bg-muted/20 px-4 pb-4 pt-2">
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 pl-8 pt-2 md:grid-cols-2 lg:grid-cols-3">
            {permissions.map((permission) => (
              <div key={permission.id} className="flex items-start gap-3">
                <Checkbox
                  id={`perm-${permission.id}`}
                  checked={assignedIds.includes(permission.id)}
                  onCheckedChange={(checked) => onTogglePermission(permission.id, !!checked)}
                />
                <div className="grid gap-1 leading-none">
                  <label
                    htmlFor={`perm-${permission.id}`}
                    className="cursor-pointer text-sm font-medium leading-none text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {permission.name}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
