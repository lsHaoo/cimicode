import { createMemo } from "solid-js"
import { useSync } from "@tui/context/sync"
import { isAllowedVisibleProvider } from "./provider-filter"

export function useConnected() {
  const sync = useSync()
  return createMemo(() =>
    (sync.data.provider ?? []).some(
      (x) =>
        isAllowedVisibleProvider(x, sync.data.config) &&
        (x.id !== "opencode" || Object.values(x.models).some((y) => y.cost?.input !== 0)),
    ),
  )
}
