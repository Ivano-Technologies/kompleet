'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MonthlyIncomeExpense } from '@/lib/dashboard/data-aggregation';

interface IncomeExpensesChartProps {
  data: MonthlyIncomeExpense[];
}

export function IncomeExpensesChart({ data }: IncomeExpensesChartProps) {
  // Format currency for tooltips
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis 
            dataKey="month" 
            stroke="rgba(255, 255, 255, 0.7)"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="rgba(255, 255, 255, 0.7)"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)',
            }}
            formatter={((value: number) => [formatCurrency(value), '']) as any}
            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="square"
          />
          <Bar 
            dataKey="income" 
            fill="#10b981" 
            name="Income"
            radius={[8, 8, 0, 0]}
          />
          <Bar 
            dataKey="expenses" 
            fill="#ef4444" 
            name="Expenses"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
