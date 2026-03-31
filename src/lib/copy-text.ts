export async function copyText(value: string): Promise<void> {
  if (!value) {
    throw new Error("Copy value is required")
  }

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard?.writeText === "function" &&
    typeof window !== "undefined" &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(value)
    return
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard API is unavailable")
  }

  const textArea = document.createElement("textarea")
  textArea.value = value
  textArea.setAttribute("readonly", "true")
  textArea.style.position = "fixed"
  textArea.style.left = "-9999px"
  textArea.style.opacity = "0"

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  textArea.setSelectionRange(0, textArea.value.length)

  const succeeded = document.execCommand("copy")

  document.body.removeChild(textArea)

  if (!succeeded) {
    throw new Error("Unable to copy text")
  }
}
