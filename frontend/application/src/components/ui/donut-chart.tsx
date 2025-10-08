import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltipContent } from "./chart";

export type DonutChartProps = {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  innerRadius?: number;
  outerRadius?: number;
  showLabel?: boolean;
  showPercentageOnSlice?: boolean;
  centerLabel?: {
    title: string;
    value: string;
  };
  className?: string;
  paddingAngle?: number;
  hoverOffset?: number;
};

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  innerRadius = 60,
  outerRadius = 80,
  showPercentageOnSlice = false,
  centerLabel,
  className,
  paddingAngle = 5,
  hoverOffset = 10,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Custom label component to render text on pie slices
  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, percent } = props;
    const RADIAN = Math.PI / 180;
    // Position the label in the middle of the slice
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontWeight="bold"
        fontSize="12"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className={`relative w-full h-full ${className || ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showPercentageOnSlice ? renderCustomizedLabel : undefined}
            innerRadius={innerRadius}
            outerRadius={(index) =>
              activeIndex === index ? outerRadius + hoverOffset : outerRadius
            }
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            paddingAngle={paddingAngle}
            cornerRadius={4}
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            animationBegin={0}
            animationDuration={400}
            activeShape={{
              stroke: "#111827",
              strokeWidth: 2,
            }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                strokeWidth={activeIndex === index ? 2 : 0}
                stroke="#fff"
                style={{
                  filter:
                    activeIndex === index
                      ? "drop-shadow(0 0 8px rgba(255, 255, 255, 0.2))"
                      : "none",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => (
              <ChartTooltipContent
                active={active}
                payload={payload}
                formatter={(value) => `${value}%`}
              />
            )}
            wrapperStyle={{ outline: "none" }}
          />
        </PieChart>
      </ResponsiveContainer>

      {centerLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-2xl font-bold text-white">{centerLabel.value}</p>
          <p className="text-sm text-gray-400">{centerLabel.title}</p>
        </div>
      )}
    </div>
  );
};
