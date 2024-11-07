import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip } from 'recharts';

interface HeatmapProps {
    data: {
        campaign: string;
        hour: number;
        cost: number;
    }[];
}

export function HourCostHeatmap({ data }: HeatmapProps) {
    const formattedData = data.map(d => ({
        x: d.hour,
        y: d.campaign,
        z: d.cost
    }));

    return (
        <ResponsiveContainer width="100%" height={400}>
            <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
                <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Hour" 
                    tickFormatter={(value) => `${value}:00`}
                />
                <YAxis type="category" dataKey="y" name="Campaign" />
                <ZAxis type="number" dataKey="z" name="Cost" />
                <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    cursor={{ strokeDasharray: '3 3' }}
                />
                <Scatter data={formattedData} fill="#8884d8" />
            </ScatterChart>
        </ResponsiveContainer>
    );
} 