import api from "@/lib/api-client"
import {
  EmailPlateAlertRule,
  EmailPlateAlertRuleMutationPayload,
  EmailRecipient,
  EmailRecipientMutationPayload,
  EmailSmtpAccount,
  EmailSmtpAccountMutationPayload,
  WhatsappAccount,
  WhatsappAccountMutationPayload,
  WhatsappRecipient,
  WhatsappRecipientMutationPayload,
} from "@/types/email-integration"

export const emailIntegrationService = {
  listSmtpAccounts: async () => {
    const { data } = await api.get<EmailSmtpAccount[]>("/email-integrations/smtp-accounts")
    return Array.isArray(data) ? data : []
  },

  createSmtpAccount: async (payload: EmailSmtpAccountMutationPayload) => {
    const { data } = await api.post<EmailSmtpAccount>("/email-integrations/smtp-accounts", payload)
    return data
  },

  updateSmtpAccount: async (
    id: number,
    payload: Partial<EmailSmtpAccountMutationPayload>,
  ) => {
    const { data } = await api.patch<EmailSmtpAccount>(`/email-integrations/smtp-accounts/${id}`, payload)
    return data
  },

  deleteSmtpAccount: async (id: number) => {
    const { data } = await api.delete(`/email-integrations/smtp-accounts/${id}`)
    return data
  },

  testSmtpAccount: async (id: number) => {
    const { data } = await api.post(`/email-integrations/smtp-accounts/${id}/test`)
    return data
  },

  listRecipients: async () => {
    const { data } = await api.get<EmailRecipient[]>("/email-integrations/recipients")
    return Array.isArray(data) ? data : []
  },

  createRecipient: async (payload: EmailRecipientMutationPayload) => {
    const { data } = await api.post<EmailRecipient>("/email-integrations/recipients", payload)
    return data
  },

  updateRecipient: async (
    id: number,
    payload: Partial<EmailRecipientMutationPayload>,
  ) => {
    const { data } = await api.patch<EmailRecipient>(`/email-integrations/recipients/${id}`, payload)
    return data
  },

  deleteRecipient: async (id: number) => {
    const { data } = await api.delete(`/email-integrations/recipients/${id}`)
    return data
  },

  listWhatsappAccounts: async () => {
    const { data } = await api.get<WhatsappAccount[]>("/email-integrations/whatsapp-accounts")
    return Array.isArray(data) ? data : []
  },

  createWhatsappAccount: async (payload: WhatsappAccountMutationPayload) => {
    const { data } = await api.post<WhatsappAccount>("/email-integrations/whatsapp-accounts", payload)
    return data
  },

  updateWhatsappAccount: async (
    id: number,
    payload: Partial<WhatsappAccountMutationPayload>,
  ) => {
    const { data } = await api.patch<WhatsappAccount>(`/email-integrations/whatsapp-accounts/${id}`, payload)
    return data
  },

  connectWhatsappAccount: async (id: number) => {
    const { data } = await api.post<WhatsappAccount>(`/email-integrations/whatsapp-accounts/${id}/connect`)
    return data
  },

  disconnectWhatsappAccount: async (id: number) => {
    const { data } = await api.post(`/email-integrations/whatsapp-accounts/${id}/disconnect`)
    return data
  },

  resetWhatsappAccount: async (id: number) => {
    const { data } = await api.post<WhatsappAccount>(`/email-integrations/whatsapp-accounts/${id}/reset`)
    return data
  },

  syncWhatsappRecipients: async (id: number) => {
    const { data } = await api.post(`/email-integrations/whatsapp-accounts/${id}/sync-recipients`)
    return data as { success: boolean; imported: number }
  },

  deleteWhatsappAccount: async (id: number) => {
    const { data } = await api.delete(`/email-integrations/whatsapp-accounts/${id}`)
    return data
  },

  listWhatsappRecipients: async () => {
    const { data } = await api.get<WhatsappRecipient[]>("/email-integrations/whatsapp-recipients")
    return Array.isArray(data) ? data : []
  },

  createWhatsappRecipient: async (payload: WhatsappRecipientMutationPayload) => {
    const { data } = await api.post<WhatsappRecipient>("/email-integrations/whatsapp-recipients", payload)
    return data
  },

  updateWhatsappRecipient: async (
    id: number,
    payload: Partial<WhatsappRecipientMutationPayload>,
  ) => {
    const { data } = await api.patch<WhatsappRecipient>(`/email-integrations/whatsapp-recipients/${id}`, payload)
    return data
  },

  deleteWhatsappRecipient: async (id: number) => {
    const { data } = await api.delete(`/email-integrations/whatsapp-recipients/${id}`)
    return data
  },

  listRules: async () => {
    const { data } = await api.get<EmailPlateAlertRule[]>("/email-integrations/rules")
    return Array.isArray(data) ? data : []
  },

  createRule: async (payload: EmailPlateAlertRuleMutationPayload) => {
    const { data } = await api.post<EmailPlateAlertRule>("/email-integrations/rules", payload)
    return data
  },

  updateRule: async (
    id: number,
    payload: Partial<EmailPlateAlertRuleMutationPayload>,
  ) => {
    const { data } = await api.patch<EmailPlateAlertRule>(`/email-integrations/rules/${id}`, payload)
    return data
  },

  deleteRule: async (id: number) => {
    const { data } = await api.delete(`/email-integrations/rules/${id}`)
    return data
  },

  testRule: async (id: number) => {
    const { data } = await api.post(`/email-integrations/rules/${id}/test`)
    return data as {
      success: boolean
      subject: string
      channels: Record<string, { recipients: string[]; recipientCount: number; subject?: string }>
    }
  },
}
