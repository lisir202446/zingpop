export function handleConsolePipeError(error: unknown) {
  if (isPipeError(error)) return
  throw error
}

export function isPipeError(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "EPIPE"
  )
}
