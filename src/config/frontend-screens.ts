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
  "admin.cameras": {
    title: "Câmeras",
    description: "Gerenciamento de câmeras de vigilância.",
    group: "Equipamentos",
  },
}
