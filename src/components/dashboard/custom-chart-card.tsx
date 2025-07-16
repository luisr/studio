// src/components/dashboard/custom-chart-card.tsx
"use client";

import { useMemo } from 'react';
import type { Task, CustomChartDefinition } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Legend, ResponsiveContainer } from 'recharts';

interface CustomChartCardProps {
  chartDef: CustomChartDefinition;
  tasks: Task[];
}

// Simple hash function to generate a color from a string
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

export function CustomChartCard({ chartDef, tasks }: CustomChartCardProps) {
  const chartData = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const getFieldValue = (task: Task, field: string) => {
        if (field === 'assignee') return task.assignee.name;
        if (field === 'status') return task.status;
        if (field === 'priority') return task.priority;
        return task.customFields?.[field] ?? 'N/A';
    }

    const groupedData = tasks.reduce((acc, task) => {
      const keyField = chartDef.type === 'bar' ? chartDef.xAxisField : chartDef.segmentField;
      if (!keyField) return acc;
      
      const key = getFieldValue(task, keyField);

      if (!acc[key]) {
        acc[key] = { count: 0, plannedHours: 0, actualHours: 0, tasks: [] };
      }

      acc[key].count++;
      acc[key].plannedHours += task.plannedHours || 0;
      acc[key].actualHours += task.actualHours || 0;
      acc[key].tasks.push(task);

      return acc;
    }, {} as Record<string, { count: number; plannedHours: number; actualHours: number, tasks: Task[] }>);


    if (chartDef.type === 'bar') {
       return Object.entries(groupedData).map(([name, data]) => {
            let value;
            if(chartDef.yAxisAggregation === 'average') {
                value = data[chartDef.yAxisField || 'plannedHours'] / data.count;
            } else { // sum
                value = data[chartDef.yAxisField || 'plannedHours'];
            }
            return { name, value: parseFloat(value.toFixed(2)) };
        });
    }

    if (chartDef.type === 'pie') {
        return Object.entries(groupedData).map(([name, data]) => {
            let value;
            if(chartDef.valueField === 'count') {
                value = data.count;
            } else { // sum of hours
                value = data[chartDef.valueField || 'plannedHours'];
            }
            return { name, value, fill: stringToColor(name) };
        });
    }

    return [];
  }, [chartDef, tasks]);

  if (!chartData || chartData.length === 0) {
    return (
       <Card>
        <CardHeader>
          <CardTitle>{chartDef.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">Sem dados para exibir.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{chartDef.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[300px] w-full">
          {chartDef.type === 'bar' ? (
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 15) + '...'}/>
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="hsl(var(--chart-3))" name={chartDef.name} radius={4} />
                </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
