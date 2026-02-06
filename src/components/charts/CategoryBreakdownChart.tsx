'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { CategoryBreakdown } from '@/lib/dashboard/data-aggregation';

interface CategoryBreakdownChartProps {
  data: CategoryBreakdown[];
}

// Nigerian-inspired color palette with subtle local theme
const COLORS = [
  '#008751', // Green from Nigerian flag
  '#FFB81C', // Gold/Yellow
  '#E74C3C', // Red
  '#3498DB', // Blue
  '#9B59B6', // Purple
  '#1ABC9C', // Turquoise
  '#F39C12', // Orange
  '#34495E', // Dark gray
  '#16A085', // Teal
  '#D35400', // Dark orange
];

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  // Format currency for tooltips
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom label for pie slices
  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius="80%"
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)',
            }}
            formatter={((value: number, name: string) => [
              formatCurrency(value),
              name,
            ]) as any}
            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
