import type { ParentProps } from "solid-js"

export function SSOGate(props: ParentProps<{ ready: boolean }>) {
  return props.ready ? props.children : null
}
