import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartTooltipContent } from './chart';

export type DonutChartProps = {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  innerRadius?: number;
  outerRadius?: number;
  showLabel?: boolean;
  centerLabel?: {
    title: string;
    value: string;
  };
  className?: string;
};

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  innerRadius = 60,
  outerRadius = 80,
  showLabel = false,
  centerLabel,
  className,
}) => {
  return (
    <div className={`relative w-full h-full ${className || ''}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={showLabel}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
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