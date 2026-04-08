import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{ value?: string; id: string }>({ id: "default" })

function Tabs({
  className,
  defaultValue,
  value,
  onValueChange,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [currentValue, setCurrentValue] = React.useState(value || defaultValue)
  const id = React.useId()

  React.useEffect(() => {
    if (value !== undefined) {
      setCurrentValue(value)
    }
  }, [value])

  const handleValueChange = (v: string) => {
    setCurrentValue(v)
    onValueChange?.(v)
  }

  return (
    <TabsContext.Provider value={{ value: currentValue, id }}>
      <TabsPrimitive.Root
        data-slot="tabs"
        className={cn("flex flex-col gap-2", className)}
        value={currentValue}
        onValueChange={handleValueChange}
        {...props}
      />
    </TabsContext.Provider>
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  const syncScrollState = React.useCallback(() => {
    const node = listRef.current

    if (!node) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }

    const hasOverflow = node.scrollWidth > node.clientWidth + 4
    setCanScrollLeft(hasOverflow && node.scrollLeft > 4)
    setCanScrollRight(hasOverflow && node.scrollLeft + node.clientWidth < node.scrollWidth - 4)
  }, [])

  React.useEffect(() => {
    syncScrollState()

    const node = listRef.current

    if (!node) {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      syncScrollState()
    })

    resizeObserver.observe(node)

    const children = Array.from(node.children)
    children.forEach((child) => resizeObserver.observe(child))

    node.addEventListener("scroll", syncScrollState, { passive: true })
    window.addEventListener("resize", syncScrollState)

    return () => {
      resizeObserver.disconnect()
      node.removeEventListener("scroll", syncScrollState)
      window.removeEventListener("resize", syncScrollState)
    }
  }, [syncScrollState])

  const scrollTabs = (direction: "left" | "right") => {
    const node = listRef.current
    if (!node) return

    const amount = Math.max(node.clientWidth * 0.7, 120)
    node.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }

  return (
    <div className="relative max-w-full">
      <div className="relative inline-flex h-9 max-w-full overflow-hidden rounded-lg bg-muted align-top">
        <AnimatePresence initial={false}>
          {canScrollLeft ? (
            <motion.div
              key="tabs-scroll-left"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="pointer-events-none absolute inset-y-0 left-0 z-20 flex items-center rounded-l-lg bg-gradient-to-r from-muted via-muted/92 to-transparent pl-1 pr-4"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="pointer-events-auto h-6 w-6 rounded-md border border-border/70 bg-background/90 text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-background hover:text-foreground"
                onClick={() => scrollTabs("left")}
                aria-label="Rolar abas para a esquerda"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {canScrollRight ? (
            <motion.div
              key="tabs-scroll-right"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="pointer-events-none absolute inset-y-0 right-0 z-20 flex items-center justify-end rounded-r-lg bg-gradient-to-l from-muted via-muted/92 to-transparent pr-1 pl-4"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="pointer-events-auto h-6 w-6 rounded-md border border-border/70 bg-background/90 text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-background hover:text-foreground"
                onClick={() => scrollTabs("right")}
                aria-label="Rolar abas para a direita"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <TabsPrimitive.List
          ref={listRef}
          data-slot="tabs-list"
          className={cn(
            "text-muted-foreground relative inline-flex h-full max-w-full items-center justify-start gap-0 overflow-x-auto overflow-y-hidden p-[3px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            canScrollLeft && "pl-7",
            canScrollRight && "pr-7",
            className
          )}
          {...props}
        />
      </div>
    </div>
  )
}

function TabsTrigger({
  className,
  children,
  value,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const { value: activeValue, id } = React.useContext(TabsContext)
  const isActive = activeValue === value

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      value={value}
      className={cn(
        "relative focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:!text-white z-10",
        className
      )}
      {...props}
    >
      <span className="relative z-20 pointer-events-none text-inherit">{children}</span>
      {isActive && (
        <motion.div
          layoutId={`active-tab-${id}`}
          className="absolute inset-0 rounded-md bg-primary shadow-sm z-10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </TabsPrimitive.Trigger>
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
