import { CallCenterExtension } from "@/types/call-center-extension"

export function getExtensionTotemLabel(
  extension: CallCenterExtension,
  fallback: string,
) {
  if (!extension.totem?.numero) return fallback

  const pointReference =
    extension.totem.ponto?.pontoDeReferencia || extension.totem.ponto?.nome

  return pointReference
    ? `${extension.totem.numero} - ${pointReference}`
    : extension.totem.numero
}

export function getExtensionSearchIndex(
  extension: CallCenterExtension,
  fallback: string,
) {
  return [
    extension.numeroRamal,
    extension.descricao,
    extension.queueName,
    extension.status,
    extension.type,
    getExtensionTotemLabel(extension, fallback),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}
