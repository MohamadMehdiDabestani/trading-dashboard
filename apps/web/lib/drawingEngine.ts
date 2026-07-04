// DrawingEngine.ts
import { IChartApi, ISeriesApi, Time } from "lightweight-charts"

export type Point = {
  time: Time
  price: number
}

export type DrawingType =
  | "horizontal"
  | "trend"
  | "rectangle"
  | "orderLine"
  | "position" 
  | "brush"

export type Drawing = {
  id: string
  type: DrawingType
  points: Point[]
  selected?: boolean
}

export class DrawingEngine {
  private chart: IChartApi
  private series: ISeriesApi<any>
  public canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  drawings: Drawing[] = []

  constructor(
    chart: IChartApi,
    series: ISeriesApi<any>,
    container: HTMLElement
  ) {
    this.chart = chart
    this.series = series

    this.canvas = document.createElement("canvas")
    this.canvas.style.position = "absolute"
    this.canvas.style.left = "0"
    this.canvas.style.top = "0"
    this.canvas.style.pointerEvents = "none" // برای اینکه مانع کلیک روی چارت نشود
    this.canvas.style.zIndex = "10"

    container.appendChild(this.canvas)

    const ctx = this.canvas.getContext("2d")
    if (!ctx) throw new Error("canvas context")

    this.ctx = ctx
    this.resize()

    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      this.render()
    })

    window.addEventListener("resize", this.resize)
  }

  resize = () => {
    if (!this.canvas.parentElement) return
    const rect = this.canvas.parentElement.getBoundingClientRect()
    this.canvas.width = rect.width
    this.canvas.height = rect.height
    this.render()
  }

  add(d: Drawing) {
    this.drawings.push(d)
    this.render()
  }

  delete(id: string) {
    this.drawings = this.drawings.filter(d => d.id !== id)
    this.render()
  }

  select(id: string) {
    this.drawings.forEach(d => (d.selected = d.id === id))
    this.render()
  }

  private xy(p: Point) {
    const x = this.chart.timeScale().timeToCoordinate(p.time)
    const y = this.series.priceToCoordinate(p.price)
    if (x == null || y == null) return null
    return { x, y }
  }

  render() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    for (const d of this.drawings) {
      if (d.points.length === 0) continue

      // Horizontal & Order Line
      if (d.type === "horizontal" || d.type === "orderLine") {
        const p = this.xy(d.points[0])
        if (!p) continue

        ctx.strokeStyle = d.type === "orderLine" ? "#f87171" : (d.selected ? "#fff" : "#4ade80")
        ctx.lineWidth = d.type === "orderLine" ? 1.5 : 2
        if (d.type === "orderLine") ctx.setLineDash([4, 4]) // خط‌چین برای اوردرها
        else ctx.setLineDash([])

        ctx.beginPath()
        ctx.moveTo(0, p.y)
        ctx.lineTo(this.canvas.width, p.y)
        ctx.stroke()
        ctx.setLineDash([]) // reset
      }

      // Trend Line
      if (d.type === "trend" && d.points.length >= 2) {
        const p1 = this.xy(d.points[0])
        const p2 = this.xy(d.points[1])
        if (!p1 || !p2) continue

        ctx.strokeStyle = d.selected ? "#fff" : "#60a5fa"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
      }

      // Rectangle & Position
      if ((d.type === "rectangle" || d.type === "position") && d.points.length >= 2) {
        const p1 = this.xy(d.points[0])
        const p2 = this.xy(d.points[1])
        if (!p1 || !p2) continue

        const w = p2.x - p1.x
        const h = p2.y - p1.y

        ctx.fillStyle = d.type === "position" ? "rgba(34,197,94,0.25)" : "rgba(59,130,246,0.2)"
        ctx.strokeStyle = d.selected ? "#fff" : "#60a5fa"
        ctx.lineWidth = 1.5

        ctx.beginPath()
        ctx.rect(p1.x, p1.y, w, h)
        ctx.fill()
        ctx.stroke()
      }

      // Brush (Freehand Drawing)
      if (d.type === "brush" && d.points.length > 1) {
        ctx.strokeStyle = d.selected ? "#fff" : "#eab308" // رنگ زرد برای براش
        ctx.lineWidth = 2.5
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.beginPath()

        let first = true
        for (const pt of d.points) {
          const p = this.xy(pt)
          if (!p) continue
          if (first) {
            ctx.moveTo(p.x, p.y)
            first = false
          } else {
            ctx.lineTo(p.x, p.y)
          }
        }
        ctx.stroke()
      }
    }
  }

  destroy() {
    window.removeEventListener("resize", this.resize)
    this.canvas.remove()
  }
}