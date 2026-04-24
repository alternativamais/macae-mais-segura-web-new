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
    group: "Equipamentos",
  },
  "admin.company_dashboards": {
    title: "Dashboards",
    description: "Montagem e configuração de dashboards específicos por empresa.",
    group: "Administração Manual",
  },
  "admin.shared_infrastructure": {
    title: "Equipamentos compartilhados",
    description: "Gerenciamento centralizado de pontos, totens e equipamentos compartilhados entre empresas.",
    group: "Administração Manual",
  },
  "admin.lpr_fines_reports": {
    title: "LPR multas",
    description: "Consulta das placas capturadas pelas regras de notificações, com imagem da LPR e histórico de entregas.",
    group: "Administração Manual",
  },
  "admin.companies": {
    title: "Empresas",
    description: "Gestão de empresas vinculadas ao sistema.",
    group: "Administração Manual",
  },
  "admin.integracoes": {
    title: "Forças de Segurança",
    description: "Hub das integrações LPR responsáveis pelo envio de leituras de placas para forças de segurança.",
    group: "Integrações LPR",
  },
  "admin.email_integrations": {
    title: "Notificações",
    description: "Configuração de contas SMTP, destinatários e regras de notificação por email.",
    group: "Integrações LPR",
  },

  "admin.call_center": {
    title: "Central de Atendimento",
    description: "Monitoramento em tempo real das ligações do call center e gestão do ramal do agente.",
    group: "Telefonia",
  },
  "admin.call_center_extensions": {
    title: "Ramais",
    description: "Gestão dos ramais da central e vínculos com totens.",
    group: "Telefonia",
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
