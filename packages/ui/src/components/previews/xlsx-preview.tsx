import { createEffect, createSignal, For, Show } from "solid-js"
import ExcelJS from "exceljs"

interface CellData {
  value: string
  style: Record<string, string>
  merge?: { rowSpan: number; colSpan: number }
}

interface SheetData {
  name: string
  rows: CellData[][]
  colWidths: number[]
}

interface XlsxPreviewProps {
  data: string | undefined
  path?: string
  onLoad?: () => void
  onError?: () => void
}

const MAX_ROWS = 500
const MAX_COLS = 30

// 解析颜色
function argbToRgba(argb: string): string | undefined {
  if (!argb) return undefined
  const clean = argb.replace(/^FF/i, "")
  if (clean.length !== 6) return undefined
  return `#${clean}`
}

// 获取单元格样式
function getCellStyle(cell: ExcelJS.Cell): Record<string, string> {
  const style: Record<string, string> = {
    "border": "1px solid #d4d4d4",
    "padding": "4px 8px",
    "white-space": "nowrap",
    "vertical-align": "middle",
    "text-align": "left",
  }

  const font = cell.font
  const fill = cell.fill
  const alignment = cell.alignment
  const border = cell.border

  // 字体
  if (font) {
    if (font.bold) style["font-weight"] = "bold"
    if (font.italic) style["font-style"] = "italic"
    if (font.underline) style["text-decoration"] = "underline"
    if (font.strike) style["text-decoration"] = "line-through"
    if (font.size) style["font-size"] = `${font.size}pt`
    if (font.name) style["font-family"] = font.name
    if (font.color?.argb) {
      const color = argbToRgba(font.color.argb)
      if (color) style["color"] = color
    }
  }

  // 填充/背景色
  if (fill?.type === "pattern" && fill.pattern === "solid" && fill.fgColor?.argb) {
    const bgColor = argbToRgba(fill.fgColor.argb)
    if (bgColor) style["background-color"] = bgColor
  }

  // 对齐
  if (alignment) {
    if (alignment.horizontal) style["text-align"] = alignment.horizontal
    if (alignment.vertical) style["vertical-align"] = alignment.vertical
    if (alignment.wrapText) style["white-space"] = "pre-wrap"
  }

  // 边框
  if (border) {
    const getBorderStyle = (b: ExcelJS.Border): string => {
      if (!b || !b.style) return ""
      const width = b.style === "medium" ? "2px" : b.style === "thick" ? "3px" : "1px"
      const color = b.color?.argb ? argbToRgba(b.color.argb) || "#000000" : "#000000"
      return `${width} solid ${color}`
    }
    if (border.top) style["border-top"] = getBorderStyle(border.top as ExcelJS.Border)
    if (border.bottom) style["border-bottom"] = getBorderStyle(border.bottom as ExcelJS.Border)
    if (border.left) style["border-left"] = getBorderStyle(border.left as ExcelJS.Border)
    if (border.right) style["border-right"] = getBorderStyle(border.right as ExcelJS.Border)
  }

  return style
}

// 获取单元格值
function getCellValue(cell: ExcelJS.Cell): string {
  const value = cell.value

  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE"
  if (value instanceof Date) return value.toLocaleDateString()
  if (typeof value === "object" && "result" in value) {
    return String((value as any).result ?? "")
  }

  return String(value)
}

export function XlsxPreview(props: XlsxPreviewProps) {
  const [sheets, setSheets] = createSignal<SheetData[]>([])
  const [activeSheet, setActiveSheet] = createSignal(0)
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal(false)

  createEffect(() => {
    if (!props.data) return

    const parseXlsx = async () => {
      try {
        setLoading(true)
        setError(false)

        // 处理data URL前缀
        let base64Data = props.data!
        if (base64Data.startsWith("data:")) {
          const base64Start = base64Data.indexOf("base64,")
          if (base64Start !== -1) {
            base64Data = base64Data.substring(base64Start + 7)
          }
        }

        // Base64解码
        const binaryString = atob(base64Data)

        // 创建ArrayBuffer
        const buffer = new ArrayBuffer(binaryString.length)
        const view = new Uint8Array(buffer)
        for (let i = 0; i < binaryString.length; i++) {
          view[i] = binaryString.charCodeAt(i)
        }

        // 加载Excel
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer as any)

        const sheetData: SheetData[] = []

        workbook.eachSheet((worksheet) => {
          const rows: CellData[][] = []
          const colWidths: number[] = []

          // 获取列宽
          worksheet.columns.forEach((col, index) => {
            const width = col.width || 10
            colWidths[index] = Math.min(width * 7, 300)
          })

          // 遍历行
          const maxRows = Math.min(worksheet.rowCount, MAX_ROWS)
          const maxCols = Math.min(worksheet.columnCount, MAX_COLS)

          for (let r = 1; r <= maxRows; r++) {
            const row: CellData[] = []
            const excelRow = worksheet.getRow(r)

            for (let c = 1; c <= maxCols; c++) {
              const cell = excelRow.getCell(c)

              const cellData: CellData = {
                value: getCellValue(cell),
                style: getCellStyle(cell),
              }

              row.push(cellData)
            }
            rows.push(row)
          }

          sheetData.push({
            name: worksheet.name,
            rows,
            colWidths,
          })
        })

        setSheets(sheetData)
        setLoading(false)
        props.onLoad?.()
      } catch (err) {
        console.error("XLSX parse error:", err)
        setError(true)
        setLoading(false)
        props.onError?.()
      }
    }

    parseXlsx()
  })

  const currentSheet = () => sheets()[activeSheet()]

  return (
    <div class="flex flex-col gap-3 w-full">
      <Show when={loading()}>
        <div class="flex min-h-40 items-center justify-center text-text-weak">Loading spreadsheet...</div>
      </Show>
      <Show when={error()}>
        <div class="flex min-h-40 items-center justify-center text-text-weak">Failed to load spreadsheet</div>
      </Show>
      <Show when={!loading() && !error()}>
        {/* 工作表标签 */}
        <Show when={sheets().length > 1}>
          <div class="flex gap-1 flex-wrap">
            <For each={sheets()}>
              {(sheet, index) => (
                <button
                  class={`px-3 py-1.5 rounded-t text-sm border-b-2 transition-colors ${
                    activeSheet() === index()
                      ? "bg-background-stronger border-accent text-text-strong"
                      : "bg-transparent border-transparent text-text-weak hover:text-text-strong hover:bg-background-stronger/50"
                  }`}
                  onClick={() => setActiveSheet(index())}
                >
                  {sheet.name}
                </button>
              )}
            </For>
          </div>
        </Show>

        <Show when={currentSheet()}>
          <div class="h-full rounded border border-border-weak-base bg-white">
            <table
              class="border-collapse"
              style={{ "font-size": "13px", "font-family": "Calibri, system-ui, sans-serif" }}
            >
              <tbody>
                <For each={currentSheet()?.rows}>
                  {(row) => (
                    <tr>
                      <For each={row}>
                        {(cell, colIndex) => {
                          const colWidth = currentSheet()?.colWidths[colIndex()]
                          const style = { ...cell.style }
                          if (colWidth) style["min-width"] = `${colWidth}px`

                          return (
                            <td style={style}>
                              {cell.value}
                            </td>
                          )
                        }}
                      </For>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>

        {/* 统计信息 */}
        <Show when={currentSheet() && currentSheet()?.rows?.length > 0}>
          <div class="text-xs text-text-weak flex justify-between">
            <span>
              {currentSheet()?.rows?.length} rows × {currentSheet()?.rows?.[0]?.length || 0} columns
            </span>
          </div>
        </Show>
      </Show>
    </div>
  )
}