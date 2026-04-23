import { popularProviders, popularProviderSet } from "./provider-order"

export function pickDefaultModel(input: {
  connected: Array<{
    id: string
    models: Record<string, { id: string }>
  }>
  defaults: Record<string, string | undefined>
  valid: (model: { providerID: string; modelID: string; variant?: string }) => boolean
}) {
  const ordered = [
    ...popularProviders.flatMap((id) => input.connected.filter((provider) => provider.id === id)),
    ...input.connected.filter((provider) => !popularProviderSet.has(provider.id)),
  ]

  for (const provider of ordered) {
    const configured = input.defaults[provider.id]
    if (configured) {
      const model = { providerID: provider.id, modelID: configured }
      if (input.valid(model)) return model
    }

    const first = Object.values(provider.models)[0]
    if (!first) continue
    const model = { providerID: provider.id, modelID: first.id }
    if (input.valid(model)) return model
  }
}
