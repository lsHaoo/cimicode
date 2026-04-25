export const serviceText = "cimicode:web:restart-service"

export function serviceReady(win: Window = window) {
  return win.parent !== win
}

export function servicePost(win: Window = window) {
  if (!serviceReady(win)) return false
  win.parent.postMessage(serviceText, "*")
  return true
}
