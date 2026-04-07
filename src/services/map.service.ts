import api from "@/lib/api-client"
import { OperationalMapPoint } from "@/types/map"

export const mapService = {
  findPoints: async () => {
    const { data } = await api.get<OperationalMapPoint[]>("/pontos/mapa")
    return Array.isArray(data) ? data : []
  },
}
