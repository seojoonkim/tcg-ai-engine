'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: number[];
  positive?: boolean;
}

export default function Sparkline({ data, positive }: SparklineProps) {
  if (!data || data.length < 2) {
    return <div style={{ width: 100, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A92A6', fontSize: 11 }}>—</div>;
  }
  const chartData = data.map((v, i) => ({ i, v }));
  const color = positive ? '#16C784' : '#EA3943';
  return (
    <ResponsiveContainer width={100} height={40}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          dot={false}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
