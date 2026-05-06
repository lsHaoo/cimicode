import type { AssistantMessage, Message, Part, Provider, UserMessage } from "@opencode-ai/sdk/v2"

type SessionInfo = {
  id: string
  title?: string
  time: {
    created: number
    updated: number
  }
}

function modelName(providers: Provider[], providerID: string, modelID: string) {
  const provider = providers.find((p) => p.id === providerID)
  const model = provider?.models[modelID]
  return model?.name ?? `${providerID}/${modelID}`
}

function formatPart(part: Part): string {
  if (part.type === "text" && !part.synthetic) return `${part.text}\n\n`
  if (part.type === "reasoning") return `_Thinking:_\n\n${part.text}\n\n`

  if (part.type === "tool") {
    let result = `**Tool: ${part.tool}**\n`
    if (part.state.input) result += `\n**Input:**\n\`\`\`json\n${JSON.stringify(part.state.input, null, 2)}\n\`\`\`\n`
    if (part.state.status === "completed" && part.state.output)
      result += `\n**Output:**\n\`\`\`\n${part.state.output}\n\`\`\`\n`
    if (part.state.status === "error" && part.state.error)
      result += `\n**Error:**\n\`\`\`\n${part.state.error}\n\`\`\`\n`
    return result + "\n"
  }

  return ""
}

function formatMessage(msg: Message, parts: Part[], providers: Provider[]): string {
  let result = ""

  if (msg.role === "user") {
    result += "## User\n\n"
  } else {
    const duration =
      msg.time.completed && msg.time.created ? ((msg.time.completed - msg.time.created) / 1000).toFixed(1) + "s" : ""
    const model = modelName(providers, msg.providerID, msg.modelID)
    const agent = msg.agent.charAt(0).toUpperCase() + msg.agent.slice(1)
    result += `## Assistant (${agent} · ${model}${duration ? ` · ${duration}` : ""})\n\n`
  }

  for (const part of parts) result += formatPart(part)
  return result
}

export function formatTranscript(
  session: SessionInfo,
  messages: Message[],
  parts: Record<string, Part[]>,
  providers: Provider[],
): string {
  let transcript = `# ${session.title ?? "Untitled"}\n\n`
  transcript += `**Session ID:** ${session.id}\n`
  transcript += `**Created:** ${new Date(session.time.created).toLocaleString()}\n`
  transcript += `**Updated:** ${new Date(session.time.updated).toLocaleString()}\n\n`
  transcript += "---\n\n"

  for (const msg of messages) {
    transcript += formatMessage(msg, parts[msg.id] ?? [], providers)
    transcript += "---\n\n"
  }

  return transcript
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
