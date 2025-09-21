import * as React from "react"
import { Tooltip as RechartsTooltip } from "recharts"

export interface ChartConfig {
  [key: string]: {
    label: string
    color?: string
  }
}

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, className, children, ...props }, ref) => {
    // Create CSS variables for colors
    const cssVars = React.useMemo(() => {
      const vars: Record<string, string> = {}
      
      Object.entries(config).forEach(([key, value]) => {
        if (value.color) {
          vars[`--chart-${key}`] = value.color
        }
      })
      
      return vars
    }, [config])

    return (
      <div
        ref={ref}
        className={className}
        style={cssVars}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ChartContainer.displayName = "ChartContainer"

type TooltipItem = {
  name: string
  value: string | number
  payload: Record<string, unknown>
  color?: string
  [key: string]: unknown
}

// @ts-expect-error - Ignoring type issues with recharts tooltip
const ChartTooltip = ({ content, ...props }) => {
  return <RechartsTooltip content={content} {...props} />
}
ChartTooltip.displayName = "ChartTooltip"

type ChartTooltipContentProps = React.HTMLAttributes<HTMLDivElement> & {
  active?: boolean
  payload?: TooltipItem[]
  label?: string
  formatter?: (value: string | number, name: string) => React.ReactNode
  labelFormatter?: (label: string) => React.ReactNode
  nameKey?: string
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      label,
      formatter,
      labelFormatter,
      nameKey = "name",
      className,
      ...props
    },
    ref
  ) => {
    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={`bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-md ${className || ""}`}
        {...props}
      >
        <div className="text-sm font-medium text-white mb-2">
          {labelFormatter ? labelFormatter(label || "") : label}
        </div>
        <div className="space-y-1">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {item.color && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <div className="text-xs text-gray-400">
                  {nameKey in item ? item[nameKey] as string : item.name}:
                </div>
              </div>
              <div className="text-xs font-medium text-white">
                {formatter ? formatter(item.value, item.name) : item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartContainer, ChartTooltip, ChartTooltipContent }