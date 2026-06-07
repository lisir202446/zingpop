export type ConnectionGateView = "loading" | "ready" | "error"

export function connectionGateView(input: { blocking: boolean; loading: boolean; latest?: boolean }): ConnectionGateView {
  if (input.blocking && input.loading && input.latest === undefined) return "loading"
  if (input.latest === true) return "ready"
  return "error"
}
