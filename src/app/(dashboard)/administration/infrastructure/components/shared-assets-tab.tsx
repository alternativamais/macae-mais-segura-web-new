"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Building2,
  EllipsisVertical,
  Eye,
  Network,
  Power,
  RadioTower,
  Search,
  Snowflake,
  Video,
} from "lucide-react"
import { DataTag } from "@/components/shared/data-tag"
import { TableLoadingOverlay } from "@/app/(dashboard)/access-control/components/table-loading-overlay"
import { TablePaginationFooter } from "@/app/(dashboard)/access-control/components/table-pagination-footer"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCompanyVisibility } from "@/hooks/use-company-visibility"
import { useTranslator } from "@/lib/i18n"
import {
  SharedAssetSummary,
  SharedAssetsTreeResponse,
  SharedPointTree,
  SharedTotemTree,
} from "@/types/shared-asset"
import { AssetAccessDialog } from "./asset-access-dialog"

interface SharedAssetsTabProps {
  data: SharedAssetsTreeResponse | null
  isLoading: boolean
  onReload: (empresaId?: number) => void | Promise<void>
}

type SharedAssetListItem = SharedAssetSummary & {
  parentType?: "point" | "totem" | "orphan"
  pointName?: string | null
  totemName?: string | null
  hierarchyLabel: string
  childrenSummary?: string | null
}

function getAssetIcon(type: SharedAssetSummary["type"]) {
  switch (type) {
    case "camera":
      return Video
    case "network_equipment":
      return Network
    case "smart_switch":
      return Power
    case "climate_equipment":
      return Snowflake
    case "totem":
      return RadioTower
    case "point":
      return Building2
  }
}

function getAssetTypeLabel(
  t: ReturnType<typeof useTranslator>,
  type: SharedAssetSummary["type"],
) {
  switch (type) {
    case "point":
      return t("types.point")
    case "totem":
      return t("types.totem")
    case "camera":
      return t("types.camera")
    case "network_equipment":
      return t("types.network_equipment")
    case "smart_switch":
      return t("types.smart_switch")
    case "climate_equipment":
      return t("types.climate_equipment")
  }
}

function buildPointChildrenSummary(t: ReturnType<typeof useTranslator>, point: SharedPointTree) {
  const devicesCount =
    point.cameras.length +
    point.networkEquipments.length +
    point.smartSwitches.length +
    point.climateEquipments.length

  return [
    t("totens_count", { count: point.totems.length }),
    t("devices_count", { count: devicesCount }),
  ].join(" • ")
}

function buildTotemChildrenSummary(t: ReturnType<typeof useTranslator>, totem: SharedTotemTree) {
  const devicesCount =
    totem.cameras.length +
    totem.networkEquipments.length +
    totem.smartSwitches.length +
    totem.climateEquipments.length

  return t("devices_count", { count: devicesCount })
}

function flattenTree(
  t: ReturnType<typeof useTranslator>,
  data: SharedAssetsTreeResponse | null,
) {
  if (!data) return []

  const items: SharedAssetListItem[] = []

  const pushPoint = (point: SharedPointTree) => {
    items.push({
      ...point,
      hierarchyLabel: point.subtitle || t("hierarchy.root_point"),
      childrenSummary: buildPointChildrenSummary(t, point),
    })

    point.totems.forEach((totem) => {
      items.push({
        ...totem,
        parentType: "point",
        pointName: point.title,
        hierarchyLabel: `${point.title} / ${totem.title}`,
        childrenSummary: buildTotemChildrenSummary(t, totem),
      })

      totem.cameras.forEach((asset) => {
        items.push({
          ...asset,
          parentType: "totem",
          pointName: point.title,
          totemName: totem.title,
          hierarchyLabel: `${point.title} / ${totem.title}`,
        })
      })

      totem.networkEquipments.forEach((asset) => {
        items.push({
          ...asset,
          parentType: "totem",
          pointName: point.title,
          totemName: totem.title,
          hierarchyLabel: `${point.title} / ${totem.title}`,
        })
      })

      totem.smartSwitches.forEach((asset) => {
        items.push({
          ...asset,
          parentType: "totem",
          pointName: point.title,
          totemName: totem.title,
          hierarchyLabel: `${point.title} / ${totem.title}`,
        })
      })

      totem.climateEquipments.forEach((asset) => {
        items.push({
          ...asset,
          parentType: "totem",
          pointName: point.title,
          totemName: totem.title,
          hierarchyLabel: `${point.title} / ${totem.title}`,
        })
      })
    })

    point.cameras.forEach((asset) => {
      items.push({
        ...asset,
        parentType: "point",
        pointName: point.title,
        hierarchyLabel: point.title,
      })
    })

    point.networkEquipments.forEach((asset) => {
      items.push({
        ...asset,
        parentType: "point",
        pointName: point.title,
        hierarchyLabel: point.title,
      })
    })

    point.smartSwitches.forEach((asset) => {
      items.push({
        ...asset,
        parentType: "point",
        pointName: point.title,
        hierarchyLabel: point.title,
      })
    })

    point.climateEquipments.forEach((asset) => {
      items.push({
        ...asset,
        parentType: "point",
        pointName: point.title,
        hierarchyLabel: point.title,
      })
    })
  }

  data.points.forEach(pushPoint)

  data.orphanTotems.forEach((totem) => {
    items.push({
      ...totem,
      parentType: "orphan",
      hierarchyLabel: t("hierarchy.orphan_totem"),
      childrenSummary: buildTotemChildrenSummary(t, totem),
    })

    totem.cameras.forEach((asset) => {
      items.push({
        ...asset,
        parentType: "totem",
        totemName: totem.title,
        hierarchyLabel: `${t("hierarchy.orphan_totem")} / ${totem.title}`,
      })
    })

    totem.networkEquipments.forEach((asset) => {
      items.push({
        ...asset,
        parentType: "totem",
        totemName: totem.title,
        hierarchyLabel: `${t("hierarchy.orphan_totem")} / ${totem.title}`,
      })
    })

    totem.smartSwitches.forEach((asset) => {
      items.push({
        ...asset,
        parentType: "totem",
        totemName: totem.title,
        hierarchyLabel: `${t("hierarchy.orphan_totem")} / ${totem.title}`,
      })
    })

    totem.climateEquipments.forEach((asset) => {
      items.push({
        ...asset,
        parentType: "totem",
        totemName: totem.title,
        hierarchyLabel: `${t("hierarchy.orphan_totem")} / ${totem.title}`,
      })
    })
  })

  data.orphanAssets.cameras.forEach((asset) => {
    items.push({
      ...asset,
      parentType: "orphan",
      hierarchyLabel: t("hierarchy.orphan_asset"),
    })
  })
  data.orphanAssets.networkEquipments.forEach((asset) => {
    items.push({
      ...asset,
      parentType: "orphan",
      hierarchyLabel: t("hierarchy.orphan_asset"),
    })
  })
  data.orphanAssets.smartSwitches.forEach((asset) => {
    items.push({
      ...asset,
      parentType: "orphan",
      hierarchyLabel: t("hierarchy.orphan_asset"),
    })
  })
  data.orphanAssets.climateEquipments.forEach((asset) => {
    items.push({
      ...asset,
      parentType: "orphan",
      hierarchyLabel: t("hierarchy.orphan_asset"),
    })
  })

  return items
}

export function SharedAssetsTab({
  data,
  isLoading,
  onReload,
}: SharedAssetsTabProps) {
  const t = useTranslator("shared_infrastructure")
  const { isAllCompanies } = useCompanyVisibility()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all")
  const [selectedAsset, setSelectedAsset] = useState<SharedAssetSummary | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setPage(1)
  }, [searchTerm, pageSize, selectedCompanyId])

  const allItems = useMemo(() => flattenTree(t, data), [data, t])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return allItems

    return allItems.filter((asset) =>
      [
        asset.title,
        asset.subtitle,
        asset.ownerEmpresaNome,
        asset.hierarchyLabel,
        asset.pointName,
        asset.totemName,
        ...asset.sharedCompanies.map((company) => company.nome),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    )
  }, [allItems, searchTerm])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, page, pageSize])

  const handleManageAsset = (asset: SharedAssetSummary) => {
    setSelectedAsset(asset)
    setIsPanelOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search_placeholder")}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-9"
          />
        </div>

        {isAllCompanies && data?.companies?.length ? (
          <div className="w-full max-w-xs">
            <Select
              value={selectedCompanyId}
              onValueChange={(value) => {
                setSelectedCompanyId(value)
                void onReload(value !== "all" ? Number(value) : undefined)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("filters.company_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.all_companies")}</SelectItem>
                {data.companies.map((company) => (
                  <SelectItem key={company.id} value={String(company.id)}>
                    {company.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div className="relative rounded-md border bg-card">
        {isLoading ? <TableLoadingOverlay /> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.columns.asset")}</TableHead>
              <TableHead>{t("table.columns.type")}</TableHead>
              <TableHead>{t("table.columns.hierarchy")}</TableHead>
              {isAllCompanies ? <TableHead>{t("table.columns.owner_company")}</TableHead> : null}
              <TableHead>{t("table.columns.sharing")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("table.columns.status")}</TableHead>
              <TableHead className="w-[80px] text-right">{t("table.columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading && paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAllCompanies ? 7 : 6}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : null}

            {paginatedItems.map((asset) => {
              const Icon = getAssetIcon(asset.type)

              return (
                <TableRow key={`${asset.type}-${asset.id}`}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{asset.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {asset.subtitle || asset.childrenSummary || `#${asset.id}`}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <DataTag tone="neutral">{getAssetTypeLabel(t, asset.type)}</DataTag>
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {asset.hierarchyLabel}
                  </TableCell>

                  {isAllCompanies ? (
                    <TableCell className="text-sm text-muted-foreground">
                      {asset.ownerEmpresaNome || t("not_informed")}
                    </TableCell>
                  ) : null}

                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <DataTag tone="info">
                        {t("shared_count_short", { count: asset.sharedCompanyIds.length })}
                      </DataTag>
                      {asset.sharedCompanies.slice(0, 2).map((company) => (
                        <DataTag key={`${asset.id}-${company.id}`} tone="neutral">
                          {company.nome}
                        </DataTag>
                      ))}
                      {asset.sharedCompanies.length > 2 ? (
                        <DataTag tone="neutral">
                          {t("more_companies", { count: asset.sharedCompanies.length - 2 })}
                        </DataTag>
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    {asset.status ? (
                      <DataTag tone={asset.status === "active" ? "success" : "neutral"}>
                        {asset.status === "active" ? t("status.active") : t("status.inactive")}
                      </DataTag>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="cursor-pointer">
                          <EllipsisVertical className="h-4 w-4" />
                          <span className="sr-only">{t("table.open_actions")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => handleManageAsset(asset)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {t("actions.manage_access")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <TablePaginationFooter
        page={page}
        pageSize={pageSize}
        total={filteredItems.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <AssetAccessDialog
        open={isPanelOpen}
        onOpenChange={setIsPanelOpen}
        asset={selectedAsset}
        companies={data?.companies ?? []}
        onSuccess={async () => {
          const empresaId = selectedCompanyId !== "all" ? Number(selectedCompanyId) : undefined
          await onReload(empresaId)
        }}
      />
    </div>
  )
}
