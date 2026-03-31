"use client"

import { useState } from "react"
import { FrontendScreen } from "@/types/frontend-screen"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion"
import { ChevronDown, LayoutTemplate } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslator } from "@/lib/i18n"

interface ScreenGroupAccordionProps {
  groupName: string
  screens: FrontendScreen[]
  assignedIds: number[]
  onToggleGroup: (groupScreens: FrontendScreen[], isChecked: boolean) => void
  onToggleScreen: (screenId: number, isChecked: boolean) => void
}

export function ScreenGroupAccordion({
  groupName,
  screens,
  assignedIds,
  onToggleGroup,
  onToggleScreen,
}: ScreenGroupAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslator("permissions.screens_tab")
  const allChecked = screens.every((s) => assignedIds.includes(s.id))
  const someChecked = screens.some((s) => assignedIds.includes(s.id)) && !allChecked

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
              onCheckedChange={(checked) => onToggleGroup(screens, !!checked)}
              id={`group-${groupName}`}
            />
          </div>

          <div className="flex flex-1 items-center gap-2 pr-4 text-left">
            <LayoutTemplate className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-semibold leading-none">
              {groupName || t("fallback_group")}
            </span>
          </div>

          <div className="shrink-0 text-xs font-normal text-muted-foreground">
            {t("selection_count", {
              selected: screens.filter((s) => assignedIds.includes(s.id)).length,
              total: screens.length,
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
            {screens.map((screen) => (
              <div key={screen.id} className="flex flex-col space-y-1">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`screen-${screen.id}`}
                    checked={assignedIds.includes(screen.id)}
                    onCheckedChange={(checked) => onToggleScreen(screen.id, !!checked)}
                  />
                  <div className="grid gap-1 leading-none">
                    <label
                      htmlFor={`screen-${screen.id}`}
                      className="cursor-pointer text-sm font-medium leading-none text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {screen.title}
                    </label>
                  </div>
                </div>
                {screen.description && (
                  <p className="text-xs text-muted-foreground pl-7">
                    {screen.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
