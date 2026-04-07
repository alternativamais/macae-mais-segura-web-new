export interface FrontendScreenMetadata {
  title: string
  description: string
  group: string
}

export const FRONTEND_SCREEN_METADATA: Record<string, FrontendScreenMetadata> = {
  "admin.users": {
    title: "Usuários Sistema",
    description: "Gestão dos usuários do painel administrativo.",
    group: "Administração",
  },
  "admin.roles": {
    title: "Permissões",
    description: "Configuração de perfis e permissões.",
    group: "Administração",
  },
  "admin.access_control": {
    title: "Controle de Acesso",
    description: "Bloqueios e regras de acesso.",
    group: "Administração",
  },
  "admin.backup": {
    title: "Backups",
    description: "Gerenciamento de rotinas de backup.",
    group: "Configurações",
  },
  "admin.logs": {
    title: "Logs",
    description: "Auditoria e registros do sistema.",
    group: "Configurações",
  },
  "admin.ui_settings": {
    title: "Layout e Tema",
    description: "Configuração global visual do sistema.",
    group: "Configurações",
  },
  "admin.map": {
    title: "Mapa",
    description: "Mapa operacional com pontos, totens e policiais em tempo real.",
    group: "Principal",
  },
  "admin.points": {
    title: "Pontos",
    description: "Gerenciamento dos pontos de monitoramento.",
    group: "Administração Manual",
  },
  "admin.companies": {
    title: "Empresas",
    description: "Gestão de empresas vinculadas ao sistema.",
    group: "Administração Manual",
  },
  "admin.integracoes": {
    title: "Envio de Placas",
    description: "Hub das integrações responsáveis pelo envio de leituras de placas.",
    group: "Integrações",
  },
  "admin.cameras": {
    title: "Câmeras",
    description: "Gerenciamento de câmeras de vigilância.",
    group: "Equipamentos",
  },
  "admin.totens": {
    title: "Totens",
    description: "Gerenciamento dos totens operacionais.",
    group: "Equipamentos",
  },
  "admin.smart_switches": {
    title: "Smart Switches",
    description: "Gerenciamento dos smart switches integrados ao Home Assistant.",
    group: "Equipamentos",
  },
  "admin.network_equipment": {
    title: "Equipamentos de Rede",
    description: "Gerenciamento de roteadores, ONUs, rádios e switches.",
    group: "Equipamentos",
  },
  "admin.climate_equipment": {
    title: "Equipamentos Climáticos",
    description: "Gerenciamento de estações e sensores climáticos integrados ao Home Assistant.",
    group: "Equipamentos",
  },
}
